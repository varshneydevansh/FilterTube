import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";

import { CapturePending } from "@/components/capture-pending";
import { Reveal } from "@/components/reveal";
import { devices, featuredScreen } from "@/data/screenshots";

// Tiles grow in proportion to each screen's aspect ratio, so every screen ends up the same height.
const placeholderAspect = 4 / 3;

// Two rows keep phones legible next to tablets and the TV: each row is as tall as its width allows.
const deviceRows = [
  ["iphone", "androidPhone", "androidTablet"],
  ["ipad", "androidTv"],
];

function DeviceTile({ id }) {
  const device = devices[id];
  const screen = featuredScreen(id);
  const aspect = screen ? screen.width / screen.height : placeholderAspect;
  return (
    <li className="ft-device-tile" style={{ "--tile-aspect": aspect }}>
      <Link className="group block" href={device.href}>
        <span className="ft-device-frame" style={{ aspectRatio: `${aspect}` }}>
          {screen ? (
            <img alt={screen.alt} decoding="async" height={screen.height} loading="lazy" src={screen.src} width={screen.width} />
          ) : (
            <CapturePending className="h-full" device={device.label} />
          )}
        </span>
        <span className="mt-4 flex items-start justify-between gap-2">
          <span>
            <span className="block font-display text-lg tracking-[-0.03em] text-[var(--color-ink)]">{device.label}</span>
            <span className="block text-sm text-[var(--color-muted)]">{device.status}</span>
          </span>
          <ArrowUpRight aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-muted)] transition group-hover:text-[var(--color-accent)]" size={16} weight="light" />
        </span>
      </Link>
    </li>
  );
}

export function DeviceStrip() {
  return (
    <section aria-labelledby="devices-title" className="px-4 py-16 md:px-6 md:py-24" id="devices">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <h2 className="max-w-[18ch] text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-6xl md:leading-[0.98]" id="devices-title">
            The same rules on every screen you use.
          </h2>
          <p className="mt-5 max-w-[62ch] text-pretty text-base leading-8 text-[var(--color-muted)] md:text-lg">
            iPhone, iPad, Android phones and tablets, and Android TV. No FilterTube sign-up, and no
            servers keep your data. Device sync only uses a small relay that can’t read what you sync.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-8">
          {deviceRows.map((row) => (
            <ul className="ft-device-strip" key={row.join("-")}>
              {row.map((id) => <DeviceTile id={id} key={id} />)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
