"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { GithubLogo, List, X } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import {
  navigationLinks,
  platformSlugs,
} from "@/components/site-shell-data";
import { githubHref } from "@/components/route-content";
import { ThemeToggle } from "@/components/theme-toggle";

function NavLink({
  href,
  label,
  pathname,
  onClick,
  mobile = false,
  platformsActive = false,
}) {
  const isActive =
    href === pathname ||
    (href === "/#platforms" && platformsActive) ||
    (pathname === "/" && href === "/#story");
  const baseClasses = mobile
    ? "inline-flex min-h-11 items-center rounded-[0.95rem] border border-[color:var(--color-line)] ft-glass px-4 py-3 text-sm font-medium transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
    : "inline-flex min-h-11 items-center text-[14px] font-medium transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]";

  const activeClasses = isActive
    ? mobile
      ? "text-[var(--color-ink)]"
      : "text-[var(--color-ink)]"
    : mobile
      ? "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      : "text-[var(--color-muted)] hover:text-[var(--color-ink)]";

  return (
    <Link className={`${baseClasses} ${activeClasses}`} href={href} onClick={onClick}>
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const platformsActive = Boolean(pathname && platformSlugs.includes(pathname.slice(1)));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function toggleMenu() {
    startTransition(() => {
      setMenuOpen((current) => !current);
    });
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-4 pt-5 md:px-6 md:pt-6">
        <div className="ft-shell-strong mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-[1rem] border border-[color:var(--color-line)] px-3 py-2 shadow-[0_18px_45px_-34px_rgba(18,19,29,0.45)] backdrop-blur-xl">
          <Link
            className="pointer-events-auto inline-flex min-h-11 items-center gap-3 rounded-[0.9rem] px-3 py-2 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[color:var(--color-tile)]"
            href="/"
          >
            <Image
              alt="FilterTube logo"
              className="h-9 w-9 rounded-full"
              height={36}
              priority
              src="/brand/logo.png"
              width={36}
            />
            <div className="leading-none">
              <p className="pr-0.5 font-display text-lg leading-[1.04] tracking-[-0.035em] text-[var(--color-ink)]">
                FilterTube
              </p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Calm your feed
              </p>
            </div>
          </Link>

          <nav className="pointer-events-auto hidden items-center gap-8 md:flex">
            {navigationLinks.map((link) => (
              <NavLink
                href={link.href}
                key={link.label}
                label={link.label}
                pathname={pathname}
                platformsActive={platformsActive}
              />
            ))}
          </nav>

          <div className="pointer-events-auto flex items-center gap-2">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            <a
              className="group hidden min-h-11 items-center gap-3 whitespace-nowrap rounded-[0.95rem] bg-[#222] px-4 py-2.5 text-sm font-medium text-[#fffdf9] shadow-[0_18px_38px_-28px_rgba(8,10,16,0.42)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#171717] active:translate-y-px active:scale-[0.98] md:inline-flex"
              href={githubHref}
              rel="noreferrer"
              target="_blank"
            >
              <span>GitHub</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px">
                <GithubLogo aria-hidden="true" size={15} weight="fill" />
              </span>
            </a>
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="ft-tile inline-flex min-h-11 min-w-11 items-center justify-center rounded-[0.95rem] border border-[color:var(--color-line)] text-[var(--color-ink)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 md:hidden"
              onClick={toggleMenu}
              type="button"
            >
              <span className="relative block h-5 w-5">
                <List
                  aria-hidden="true"
                  className={`absolute inset-0 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    menuOpen ? "scale-75 opacity-0" : "scale-100 opacity-100"
                  }`}
                  size={20}
                  weight="light"
                />
                <X
                  aria-hidden="true"
                  className={`absolute inset-0 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    menuOpen ? "scale-100 opacity-100" : "scale-75 opacity-0"
                  }`}
                  size={20}
                  weight="light"
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-20 bg-[rgba(15,18,26,0.48)] px-4 pt-28 backdrop-blur-2xl transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="ft-shell mx-auto max-w-[1400px] rounded-[1.4rem] border border-[color:var(--color-line)] p-2 shadow-[0_24px_60px_-40px_rgba(15,18,26,0.6)]">
          <div className="ft-shell-strong ft-inset rounded-[calc(1.4rem-0.5rem)] p-5">
            <nav className="grid gap-3">
              <ThemeToggle mobile />
              {navigationLinks.map((link, index) => (
                <div
                  key={link.label}
                  style={{ transitionDelay: `${100 + index * 45}ms` }}
                >
                  <NavLink
                    href={link.href}
                    label={link.label}
                    mobile
                    onClick={() => setMenuOpen(false)}
                    pathname={pathname}
                    platformsActive={platformsActive}
                  />
                </div>
              ))}
              <a
                className="inline-flex min-h-11 items-center justify-center gap-3 whitespace-nowrap rounded-[0.95rem] bg-[#222] px-5 py-3 text-sm font-medium text-[#fffdf9] shadow-[0_18px_38px_-28px_rgba(8,10,16,0.42)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#171717] active:translate-y-px active:scale-[0.98]"
                href={githubHref}
                rel="noreferrer"
                target="_blank"
              >
                <GithubLogo aria-hidden="true" size={15} weight="fill" />
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
