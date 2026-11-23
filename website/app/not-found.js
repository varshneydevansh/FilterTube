import Link from "next/link";

import { ActionLink, Panel } from "@/components/marketing-ui";
import { MascotSprite } from "@/components/mascot-sprite";

export const metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="px-4 pb-24 pt-32 md:px-6 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[900px]">
        <Panel innerClassName="p-8 text-center md:p-12">
          <div className="ft-paper ft-paper-ruled mx-auto max-w-[30rem] rounded-[1.75rem] px-6 pb-4 pt-6">
            <MascotSprite className="mx-auto w-[min(20rem,90%)]" loops={1} motion="untangle" />
          </div>
          <p className="mt-8 text-[0.72rem] uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Page not found
          </p>
          <h1 className="mx-auto mt-5 max-w-[16ch] text-balance font-display text-5xl tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl">
            This page got tangled up.
          </h1>
          <p className="mx-auto mt-6 max-w-[54ch] text-base leading-8 text-[var(--color-muted)]">
            Kriti is untangling it. The page may have moved during the rebuild, so head
            back home, or open the privacy page if you came from an old footer link.
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
