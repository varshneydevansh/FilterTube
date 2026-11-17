import { Mascot } from "@/components/mascot";

/** Shown where a device has no screenshots yet. Honest, and never a fake screen. */
export function CapturePending({ device, layout = "desktop", className = "" }) {
  return (
    <div className={`ft-paper ft-capture-pending ${className}`} data-layout={layout}>
      <Mascot className="h-20 w-auto" pose="uljhanAsleep" />
      <p className="mt-3 font-display text-lg tracking-[-0.03em] text-[#1d1b18]">{device} screens are on the way</p>
      <p className="mt-1 max-w-[30ch] text-sm leading-6 text-[#4f4b45]">Fresh captures from the latest build will appear here.</p>
    </div>
  );
}
