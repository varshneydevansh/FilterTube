"use client";

import { useEffect, useId, useRef, useState } from "react";

const STEPS = [
  {
    label: "Connect",
    caption: "Pair with a code or QR. Compare the safety phrase on both devices.",
  },
  {
    label: "Choose",
    caption: "Choose the profile and supported settings, filter rules, or notes to share.",
  },
  {
    label: "Share",
    caption: "Send while both devices are open and connected. Only approved parents can change child protections.",
  },
];

// Original Figure: 40 keycaps, a spacebar, trackpad, two hinges, camera,
// screen/bezel, deck, case faces, ports, and a phone with its own controls.
// The art explains a direct connection; it never reads or changes real sync state.
const KEYCAPS = Array.from({ length: 40 }, (_, index) => ({
  x: 13 + (index % 10) * 16.5,
  y: 12 + Math.floor(index / 10) * 11,
}));

export function P2PSyncExplainer({ className = "" }) {
  const [step, setStep] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const figureRef = useRef(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const captionId = `${id}-caption`;
  const titleId = `${id}-title`;
  const laptopClip = `${id}-laptop`;
  const phoneClip = `${id}-phone`;

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    let observer;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        (entries) => {
          const latest = entries[entries.length - 1];
          if (latest) setOnScreen(latest.isIntersecting);
        },
        { threshold: 0.05 },
      );
      if (figureRef.current) observer.observe(figureRef.current);
    } else {
      setOnScreen(true);
    }
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  return (
    <figure
      className={`p2p-figure ${className}`}
      data-running={onScreen && pageVisible ? "true" : "false"}
      ref={figureRef}
      aria-labelledby={titleId}
    >
      <div className="p2p-heading">
        <p id={titleId}>Connect once. Choose what to share.</p>
        <span>Illustration</span>
      </div>

      <svg
        className="p2p-art"
        viewBox="55 15 535 295"
        role="img"
        aria-label="An illustrated laptop and phone sharing directly, without a central server hub"
      >
        <defs>
          <clipPath id={laptopClip}>
            <rect x="9" y="9" width="172" height="107" rx="4" />
          </clipPath>
          <clipPath id={phoneClip}>
            <rect x="6" y="15" width="80" height="146" rx="6" />
          </clipPath>
        </defs>

        {/* Grounded shadows, then the rear-to-front faces of each device. */}
        <ellipse className="p2p-shadow" cx="214" cy="261" rx="134" ry="28" />
        <ellipse className="p2p-shadow" cx="506" cy="263" rx="51" ry="13" />

        <g className="p2p-link" data-lit={step === 2 ? "true" : "false"}>
          <path d="M326 180 L470 167" />
          <circle cx="326" cy="180" r="3" />
          <circle cx="470" cy="167" r="3" />
        </g>

        {/* Laptop display: a real side wall, outer shell, bezel and glass. */}
        <path className="p2p-edge" d="M145 40 L151 36 L332 87 L326 91 Z" />
        <path className="p2p-side" d="M326 91 L332 87 L332 212 L326 218 Z" />
        <g transform="matrix(.95 .27 0 1 145 40)">
          <rect className="p2p-case" width="190" height="128" rx="7" />
          <rect className="p2p-bezel" x="6" y="6" width="178" height="114" rx="5" />
          <rect className="p2p-screen" x="9" y="9" width="172" height="107" rx="4" />
          <circle className="p2p-dark" cx="95" cy="3" r="1.25" />
          <g clipPath={`url(#${laptopClip})`}>
            <rect className="p2p-screen-bar" x="9" y="9" width="172" height="9" />
            <circle className="p2p-accent" cx="16" cy="13.5" r="1.4" />
            <rect className="p2p-rule" x="23" y="12" width="32" height="2.5" rx="1.25" />

            <g className="p2p-scene" opacity={step === 0 ? 1 : 0}>
              <rect className="p2p-tile" x="23" y="31" width="48" height="48" rx="4" />
              <path className="p2p-qr" d="M30 38h12v12H30z M51 38h12v12H51z M30 59h12v12H30z M50 58h5v5h-5z M58 65h5v6h-5z" />
              <rect className="p2p-accent" x="89" y="40" width="21" height="7" rx="3.5" />
              <rect className="p2p-accent" x="116" y="40" width="15" height="7" rx="3.5" />
              <rect className="p2p-accent" x="137" y="40" width="19" height="7" rx="3.5" />
              <path className="p2p-lock" d="M109 70v-5a8 8 0 0 1 16 0v5 M106 70h22v18h-22z" />
              <circle className="p2p-accent" cx="117" cy="78" r="2" />
              <rect className="p2p-rule" x="25" y="94" width="121" height="3" rx="1.5" />
            </g>

            <g className="p2p-scene" opacity={step === 1 ? 1 : 0}>
              <circle className="p2p-accent-soft" cx="32" cy="34" r="9" />
              <circle className="p2p-accent" cx="32" cy="31" r="3" />
              <path className="p2p-accent" d="M27 39a5 5 0 0 1 10 0z" />
              <rect className="p2p-rule" x="48" y="30" width="66" height="4" rx="2" />
              {[53, 75, 97].map((y) => (
                <g key={y}>
                  <rect className="p2p-tile" x="23" y={y - 6} width="143" height="17" rx="3" />
                  <rect className="p2p-accent" x="30" y={y - 1} width="7" height="7" rx="1.5" />
                  <path className="p2p-check" d={`M32 ${y + 2}l1.5 1.5L36 ${y}`} />
                  <rect className="p2p-rule" x="46" y={y} width={y === 75 ? 62 : 86} height="3" rx="1.5" />
                </g>
              ))}
            </g>

            <g className="p2p-scene" opacity={step === 2 ? 1 : 0}>
              <rect className="p2p-accent-soft" x="57" y="30" width="64" height="69" rx="5" />
              <path className="p2p-document" d="M67 37h32l12 12v41H67z M99 37v12h12" />
              <rect className="p2p-accent" x="75" y="57" width="27" height="4" rx="2" />
              <rect className="p2p-rule" x="75" y="68" width="27" height="3" rx="1.5" />
              <rect className="p2p-rule" x="75" y="78" width="18" height="3" rx="1.5" />
            </g>
          </g>
        </g>

        {/* Laptop base: two case faces, top deck, forty individual keycaps. */}
        <path className="p2p-side" d="M145 167 L84 228 L84 235 L145 174 Z" />
        <path className="p2p-edge" d="M84 228 L265 279 L265 286 L84 235 Z" />
        <g transform="matrix(.95 .27 -.58 .58 145 167)">
          <rect className="p2p-case" width="190" height="105" rx="5" />
          <rect className="p2p-keywell" x="9" y="8" width="171" height="58" rx="4" />
          {KEYCAPS.map(({ x, y }) => (
            <g key={`${x}-${y}`}>
              <rect className="p2p-key-edge" x={x} y={y + 1.5} width="12.5" height="7" rx="1.2" />
              <rect className="p2p-key" x={x} y={y} width="12.5" height="7" rx="1.2" />
            </g>
          ))}
          <rect className="p2p-key-edge" x="52" y="58" width="75" height="6" rx="1.5" />
          <rect className="p2p-key" x="52" y="56.5" width="75" height="6" rx="1.5" />
          <rect className="p2p-trackpad" x="65" y="75" width="58" height="24" rx="3" />
          <circle className="p2p-case-screw" cx="7" cy="96" r="1" />
          <circle className="p2p-case-screw" cx="181" cy="96" r="1" />
        </g>
        <g transform="matrix(.95 .27 0 1 145 163)">
          <rect className="p2p-hinge" x="14" y="0" width="29" height="6" rx="2.5" />
          <rect className="p2p-hinge" x="147" y="0" width="29" height="6" rx="2.5" />
        </g>
        <g transform="matrix(-.58 .58 0 1 145 168)">
          <rect className="p2p-port" x="34" y="1" width="10" height="2.5" rx="1" />
          <rect className="p2p-port" x="52" y="1" width="14" height="2.5" rx=".8" />
          <circle className="p2p-port" cx="77" cy="2" r="1.3" />
        </g>
        <g transform="matrix(.95 .27 0 1 84 230)">
          <rect className="p2p-port" x="82" y="0" width="24" height="2" rx="1" />
        </g>

        {/* Phone: thickness, rounded casing, recessed glass and physical controls. */}
        <path className="p2p-edge" d="M470 68 L477 64 L548 84 L542 88 Z" />
        <path className="p2p-side" d="M542 88 L548 84 L548 264 L542 268 Z" />
        <g transform="matrix(.78 .22 0 1 470 68)">
          <rect className="p2p-case" width="92" height="180" rx="11" />
          <rect className="p2p-bezel" x="4" y="5" width="84" height="168" rx="9" />
          <rect className="p2p-screen" x="6" y="15" width="80" height="146" rx="6" />
          <rect className="p2p-port" x="34" y="8" width="21" height="2.5" rx="1.25" />
          <circle className="p2p-dark" cx="61" cy="9.25" r="1.6" />
          <rect className="p2p-port" x="30" y="166" width="32" height="2.5" rx="1.25" />
          <g clipPath={`url(#${phoneClip})`}>
            <g className="p2p-scene" opacity={step === 0 ? 1 : 0}>
              <rect className="p2p-tile" x="20" y="39" width="52" height="52" rx="4" />
              <path className="p2p-qr" d="M27 46h12v12H27z M52 46h12v12H52z M27 71h12v12H27z M51 68h5v5h-5z M59 76h5v7h-5z" />
              <rect className="p2p-accent" x="17" y="108" width="19" height="6" rx="3" />
              <rect className="p2p-accent" x="40" y="108" width="14" height="6" rx="3" />
              <rect className="p2p-accent" x="58" y="108" width="18" height="6" rx="3" />
              <rect className="p2p-rule" x="23" y="133" width="46" height="3" rx="1.5" />
            </g>
            <g className="p2p-scene" opacity={step === 1 ? 1 : 0}>
              <circle className="p2p-accent-soft" cx="46" cy="38" r="12" />
              <circle className="p2p-accent" cx="46" cy="34" r="4" />
              <path className="p2p-accent" d="M39 44a7 7 0 0 1 14 0z" />
              {[64, 89, 114].map((y) => (
                <g key={y}>
                  <rect className="p2p-tile" x="15" y={y} width="62" height="19" rx="3" />
                  <rect className="p2p-accent" x="22" y={y + 6} width="7" height="7" rx="1.5" />
                  <rect className="p2p-rule" x="36" y={y + 8} width="31" height="3" rx="1.5" />
                </g>
              ))}
            </g>
            <g className="p2p-scene" opacity={step === 2 ? 1 : 0}>
              <rect className="p2p-accent-soft" x="17" y="43" width="58" height="76" rx="5" />
              <path className="p2p-document" d="M26 51h27l12 12v47H26z M53 51v12h12" />
              <rect className="p2p-accent" x="33" y="74" width="24" height="4" rx="2" />
              <rect className="p2p-rule" x="33" y="86" width="24" height="3" rx="1.5" />
              <rect className="p2p-rule" x="33" y="97" width="16" height="3" rx="1.5" />
            </g>
          </g>
        </g>
        <path className="p2p-hinge" d="M544 128l3-1v26l-3 1z" />
        <path className="p2p-hinge" d="M468 110l2 1v12l-2-1z" />
        <path className="p2p-port" d="M495 257l13 4v2l-13-4z" />
        {[0, 1, 2].map((index) => (
          <circle className="p2p-port" cx={518 + index * 5} cy={265 + index * 1.4} r=".9" key={index} />
        ))}

        {step === 2 ? (
          <g className="p2p-packets" key="sharing" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <circle
                className="p2p-packet"
                cx="339"
                cy="178.8"
                r="3.5"
                key={index}
                style={{ animationDelay: `${index * 0.42}s` }}
              />
            ))}
          </g>
        ) : null}
      </svg>

      <div className="p2p-steps" role="group" aria-label="Explore the illustrated syncing steps">
        {STEPS.map(({ label }, index) => (
          <button
            type="button"
            key={label}
            aria-pressed={step === index}
            aria-controls={captionId}
            onClick={() => setStep(index)}
          >
            <span aria-hidden="true">{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <figcaption id={captionId} className="p2p-caption" aria-live="polite" aria-atomic="true">
        {STEPS[step].caption}
      </figcaption>
      <p className="p2p-note">Auto-sync is optional and in testing. Direct sync needs both devices open.</p>

      <style jsx>{`
        .p2p-figure {
          --p2p-case: color-mix(in srgb, var(--color-panel) 72%, var(--color-surface));
          --p2p-edge: color-mix(in srgb, var(--color-muted) 42%, var(--color-panel));
          --p2p-side: color-mix(in srgb, var(--color-muted) 66%, var(--color-panel));
          --p2p-screen: var(--color-cream);
          --p2p-bezel: color-mix(in srgb, var(--color-ink) 74%, var(--color-muted));
          margin: 1.5rem 0 0;
          padding: clamp(1rem, 3vw, 1.5rem);
          min-width: 0;
          border: 1px solid var(--color-line);
          border-radius: 1.5rem;
          background: var(--color-soft-panel);
          color: var(--color-ink);
        }
        .p2p-heading { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
        .p2p-heading p { margin: 0; font-size: .875rem; font-weight: 600; }
        .p2p-heading > span { color: var(--color-muted); font-size: .7rem; }
        .p2p-art { display: block; width: 100%; height: auto; margin: .5rem 0; overflow: visible; }
        .p2p-shadow { fill: color-mix(in srgb, var(--color-ink) 7%, transparent); }
        .p2p-case { fill: var(--p2p-case); stroke: var(--p2p-edge); stroke-width: .75; }
        .p2p-edge { fill: var(--p2p-edge); }
        .p2p-side { fill: var(--p2p-side); }
        .p2p-bezel { fill: var(--p2p-bezel); }
        .p2p-screen { fill: var(--p2p-screen); }
        .p2p-dark, .p2p-port { fill: var(--p2p-bezel); }
        .p2p-screen-bar, .p2p-keywell { fill: color-mix(in srgb, var(--color-muted) 17%, var(--p2p-screen)); }
        .p2p-rule { fill: color-mix(in srgb, var(--color-muted) 39%, var(--p2p-screen)); }
        .p2p-tile { fill: var(--color-surface); stroke: var(--color-line); stroke-width: .7; }
        .p2p-accent, .p2p-packet { fill: var(--color-accent); }
        .p2p-accent-soft { fill: color-mix(in srgb, var(--color-accent) 13%, var(--p2p-screen)); }
        .p2p-qr { fill: var(--color-accent); }
        .p2p-lock { fill: none; stroke: var(--color-accent); stroke-width: 1.75; stroke-linejoin: round; }
        .p2p-document { fill: var(--p2p-screen); stroke: var(--color-accent); stroke-width: 1; stroke-linejoin: round; }
        .p2p-check { fill: none; stroke: var(--color-cream); stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
        .p2p-key-edge { fill: var(--p2p-side); }
        .p2p-key { fill: var(--color-surface); stroke: var(--p2p-edge); stroke-width: .4; }
        .p2p-trackpad { fill: var(--p2p-case); stroke: var(--p2p-edge); stroke-width: .6; }
        .p2p-case-screw { fill: var(--p2p-edge); }
        .p2p-hinge { fill: var(--p2p-side); stroke: var(--p2p-edge); stroke-width: .5; }
        .p2p-link { fill: var(--color-accent); stroke: var(--color-accent); opacity: .18; transition: opacity 400ms ease; }
        .p2p-link path { fill: none; stroke-width: 1.4; }
        .p2p-link[data-lit="true"] { opacity: .72; }
        .p2p-scene { transition: opacity 350ms ease; }
        .p2p-packet { opacity: 0; animation: p2p-share 1.8s ease-in-out 2 both; }
        .p2p-figure[data-running="false"] .p2p-packet { animation-play-state: paused; }
        .p2p-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .4rem; }
        .p2p-steps button {
          display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
          min-height: 44px; padding: .5rem .6rem; border: 1px solid var(--color-line);
          border-radius: .85rem; background: var(--color-surface); color: var(--color-ink);
          cursor: pointer; font: inherit; font-size: .8rem; min-width: 0; line-height: 1.3;
          transition: border-color 180ms ease, background 180ms ease;
        }
        .p2p-steps button > span { font-size: .65rem; color: var(--color-muted); }
        .p2p-steps button:hover { border-color: var(--color-accent); }
        .p2p-steps button[aria-pressed="true"] { border-color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 9%, var(--color-surface)); }
        .p2p-steps button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
        .p2p-caption { margin-top: 1rem; min-height: 4.7em; color: var(--color-ink); font-size: .875rem; line-height: 1.6; }
        .p2p-note { margin: .35rem 0 0; color: var(--color-muted); font-size: .75rem; line-height: 1.6; }
        @keyframes p2p-share {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: .9; }
          80% { opacity: .9; }
          100% { transform: translate(117px, -10.5px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .p2p-scene, .p2p-link, .p2p-steps button { transition: none; }
          .p2p-packet { animation: none; display: none; }
        }
        @media (max-width: 360px) {
          .p2p-heading { align-items: flex-start; }
          .p2p-heading p { font-size: .8rem; }
          .p2p-steps button { padding-inline: .3rem; gap: .2rem; font-size: .75rem; }
          .p2p-steps button > span { display: none; }
        }
      `}</style>
    </figure>
  );
}
