import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";

export function Panel({ children, className = "", innerClassName = "" }) {
  return (
    <div
      className={`ft-shell rounded-[2rem] p-2 ring-1 ring-[color:var(--color-line)] shadow-[var(--shadow-diffuse)] ${className}`}
    >
      <div
        className={`ft-inset rounded-[calc(2rem-0.5rem)] bg-[var(--color-surface)] ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-[58rem]">
      <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[var(--color-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-5 max-w-[13ch] text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-[62ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function StatPill({ children }) {
  return (
    <span className="ft-tile inline-flex min-h-11 items-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--color-muted)]">
      {children}
    </span>
  );
}

function ActionInner({ children, iconClassName = "" }) {
  return (
    <>
      <span className="pr-0.5 leading-[1.05]">{children}</span>
      <span
        className={`ft-button-icon flex h-9 w-9 items-center justify-center rounded-full transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105 group-active:translate-x-0 group-active:translate-y-0 ${iconClassName}`}
      >
        <ArrowUpRight aria-hidden="true" size={16} weight="light" />
      </span>
    </>
  );
}

const baseActionClasses =
  "group inline-flex min-h-11 min-w-fit items-center justify-between gap-4 overflow-visible whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:translate-y-px active:scale-[0.98]";

export function ActionLink({
  children,
  href,
  variant = "solid",
  external = false,
  className = "",
}) {
  const iconClassName =
    variant === "secondary"
      ? "bg-[color:var(--color-elevation-spot)] text-[var(--color-ink)] shadow-[inset_0_1px_0_var(--color-inset-line)]"
      : "border-white/16 bg-white/16 text-[#fff8f1]";
  const classes =
    variant === "secondary"
      ? `${baseActionClasses} ft-action-secondary hover:-translate-y-0.5 ${className}`
      : `${baseActionClasses} ft-action-solid hover:-translate-y-0.5 ${className}`;

  if (external) {
    return (
      <a className={classes} href={href} rel="noreferrer" target="_blank">
        <ActionInner iconClassName={iconClassName}>{children}</ActionInner>
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      <ActionInner iconClassName={iconClassName}>{children}</ActionInner>
    </Link>
  );
}
