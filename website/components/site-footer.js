import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";

import { ActionLink } from "@/components/marketing-ui";
import { ScenicIllustration } from "@/components/scenic-illustration";
import {
  demoVideoHref,
  extensionInstallHref,
  footerLinks,
} from "@/components/route-content";

function FooterLink({ link }) {
  if (link.external) {
    return (
      <a
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:translate-x-1 hover:text-[var(--color-accent)]"
        href={link.href}
        rel="noreferrer"
        target="_blank"
      >
        {link.label}
        <ArrowUpRight aria-hidden="true" size={14} weight="light" />
      </a>
    );
  }

  return (
    <Link
      className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:translate-x-1 hover:text-[var(--color-accent)]"
      href={link.href}
    >
      {link.label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-4 pb-8 pt-16 md:px-6 md:pt-24">
      <div className="ft-shell mx-auto max-w-[1600px] overflow-hidden rounded-[2.8rem] border border-[color:var(--color-line)] p-2 shadow-[0_36px_110px_-56px_rgba(27,26,31,0.3)]">
        <div className="ft-shell-strong relative overflow-hidden rounded-[calc(2.8rem-0.5rem)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent_24%,rgba(255,255,255,0.06)_100%)]" />

          <div className="relative z-10 px-6 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10 lg:px-10 lg:pt-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Built for calmer YouTube
                </p>
                <h2 className="mt-5 max-w-[11ch] font-display text-4xl tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.96]">
                  Built to leave the screen calmer than it was.
                </h2>
                <p className="mt-5 max-w-[56ch] text-base leading-8 text-[var(--color-muted)]">
                  FilterTube is live today on desktop browsers, with dedicated
                  mobile, iPad, TV, Kids, and local intelligence plans being
                  shaped into the same serene system.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ActionLink external href={extensionInstallHref}>
                    Get FilterTube today
                  </ActionLink>
                  <ActionLink external href={demoVideoHref} variant="secondary">
                    See how FilterTube works
                  </ActionLink>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Product
                  </p>
                  <div className="grid gap-3">
                    {footerLinks.product.map((link) => (
                      <FooterLink key={link.label} link={link} />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Resources
                  </p>
                  <div className="grid gap-3">
                    {footerLinks.resources.map((link) => (
                      <FooterLink key={link.label} link={link} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 border-t border-[color:var(--color-line)] pt-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Independent project
                  </p>
                  <p className="mt-3 max-w-[44ch] text-sm leading-7 text-[var(--color-muted)]">
                    Local-first filtering, family-safe direction, and calmer
                    viewing across the devices that matter.
                  </p>
                </div>
                <p className="ft-footer-wordmark self-start pr-[0.1em] font-display text-[clamp(4.8rem,18vw,14.8rem)] leading-[0.82] tracking-[-0.12em] lg:mr-10 lg:self-auto xl:mr-16">
                  FilterTube
                </p>
              </div>
            </div>
          </div>

          <div className="relative border-t border-[color:var(--color-line)]">
            <ScenicIllustration
              className="h-[18rem] rounded-none md:h-[22rem] lg:h-[24rem]"
              footer
              variant="footer"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-6 pb-5 pt-10 md:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
              <div className="rounded-full border border-white/14 bg-[rgba(9,14,22,0.36)] px-4 py-2 text-[0.72rem] uppercase tracking-[0.22em] text-white/78 backdrop-blur-md">
                Serene by design. Not affiliated with Google or YouTube.
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/78">
                <a
                  className="transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white"
                  href="mailto:hello@filtertube.in"
                >
                  hello@filtertube.in
                </a>
                <span>© 2026 FilterTube</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
