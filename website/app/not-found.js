import Link from "next/link";

import { ActionLink, Panel } from "@/components/marketing-ui";

export default function NotFound() {
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[900px]">
        <Panel innerClassName="p-8 text-center md:p-12">
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Page not found
          </p>
          <h1 className="mx-auto mt-6 max-w-[10ch] font-display text-5xl tracking-[-0.06em] text-[var(--color-ink)] md:text-7xl">
            This route never made it through the filter.
          </h1>
          <p className="mx-auto mt-6 max-w-[54ch] text-base leading-8 text-[var(--color-muted)]">
            The page may have moved during the rebuild. Head back to the main
            site or open the privacy page if you came here from an old footer
            link.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ActionLink href="/">Return home</ActionLink>
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--color-line)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:text-[var(--color-accent)] active:translate-y-px active:scale-[0.99]"
              href="/privacy"
            >
              Privacy policy
            </Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}
