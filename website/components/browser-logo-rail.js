import { ArrowUpRight } from "@phosphor-icons/react/ssr";

import { browserLinks } from "@/components/route-content";

export function BrowserLogoRail({
  className = "",
  muted = false,
  panel = false,
}) {
  const shellClasses = muted
    ? "border-white/28 bg-[rgba(255,255,255,0.1)] text-[#fffaf4] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
    : "border-[color:var(--color-line)] ft-shell-strong text-[var(--color-ink)] shadow-[inset_0_1px_0_var(--color-inset-line)]";
  const noteClasses = muted ? "text-white/82" : "text-[var(--color-muted)]";
  const tileClasses = muted
    ? "border-white/20 bg-[rgba(255,255,255,0.09)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:border-white/34 hover:bg-[rgba(255,255,255,0.16)]"
    : "border-[color:var(--color-line)] ft-tile hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-shell-strong)]";

  return (
    <div
      className={`rounded-[1.7rem] border p-2 shadow-[0_22px_55px_-34px_rgba(16,18,25,0.28)] backdrop-blur-md ${shellClasses} ${className}`}
    >
      <div
        className={`grid auto-rows-fr gap-2 ${
          panel
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        }`}
      >
        {browserLinks.map((browser) => (
          <a
            className={`group flex h-full min-h-[5.5rem] items-start gap-3 rounded-[1.2rem] border px-3 py-3 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:translate-y-px active:scale-[0.99] ${tileClasses}`}
            href={browser.href}
            key={browser.name}
            rel="noreferrer"
            target="_blank"
          >
            <img
              alt={`${browser.name} logo`}
              className="h-8 w-8 rounded-full"
              height="32"
              src={browser.logo}
              width="32"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{browser.name}</p>
              <p
                className={`mt-1 whitespace-nowrap text-[0.68rem] leading-5 tracking-[-0.01em] ${noteClasses}`}
              >
                {browser.note}
              </p>
            </div>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                muted ? "bg-[rgba(255,255,255,0.12)]" : "ft-spot"
              }`}
            >
              <ArrowUpRight aria-hidden="true" size={14} weight="light" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
