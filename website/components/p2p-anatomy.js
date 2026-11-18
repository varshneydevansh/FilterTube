"use client";

import "@/tools/p2p-anatomy/kit/iso.css";

import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";

import { p2pAnatomyGeometry as G, p2pAnatomySvg } from "@/components/p2p-anatomy-art";

// Each step is true to how FilterTube device sync works (docs/app/TECHNICAL_RUNTIME.md, Nanah):
// a 4-character code or QR, a safety phrase compared on both screens, a chosen profile scope,
// an encrypted direct connection, and auto-sync that is still in testing.
const STEPS = [
  {
    label: "Pair",
    readout: "code K7QM · same on both",
    caption: "Pair with a short code or scan the QR. Nothing is trusted just because it’s nearby.",
  },
  {
    label: "Verify",
    readout: "safety phrase · matches",
    caption: "Both screens show the same safety phrase. Compare it before you continue, so you know it’s really your device.",
  },
  {
    label: "Choose",
    readout: "2 of 3 chosen · settings, rules",
    caption: "Choose what to share: a profile’s settings, filter rules or notes. The other device reviews it before anything changes.",
  },
  {
    label: "Send",
    readout: "encrypted · device to device",
    caption: "It travels encrypted, straight from one device to the other. A relay may help them find each other, but it can’t read what you send, and no FilterTube server keeps your data.",
  },
  {
    label: "Stay in sync",
    readout: "auto-sync · in testing",
    caption: "Auto-sync is in testing: verified devices can keep each other up to date. Direct sync needs FilterTube open on both devices.",
  },
];

const CHOSEN = [0, 1]; // settings and rules; notes stays in the tray

export function P2PAnatomy({ className = "" }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const rootRef = useRef(null);
  const artRef = useRef(null);
  const [step, setStep] = useState(0);
  const [touring, setTouring] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [holding, setHolding] = useState(false);
  const running = touring && !paused && !reduced && visible && !holding;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => { query.removeEventListener("change", sync); observer.disconnect(); };
  }, []);

  // The idle tour: one step every few seconds while on screen and untouched.
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setTimeout(() => setStep((current) => (current + 1) % STEPS.length), step === 3 ? 5200 : 4200);
    return () => window.clearTimeout(timer);
  }, [running, step]);

  // Parts: cartridges lift when chosen, the capsule rides the rail. Written straight to the SVG.
  useEffect(() => {
    const svg = artRef.current?.querySelector("svg");
    if (!svg) return undefined;
    const lift = (side, on) => svg.querySelectorAll(`[data-part="cart-${side}"]`).forEach((node) => {
      const chosen = CHOSEN.includes(Number(node.dataset.index));
      const up = on && chosen ? 7 : 0;
      node.style.transform = `translate(${G.unitZ[0] * up}px, ${G.unitZ[1] * up}px)`;
      node.dataset.chosen = on && chosen ? "true" : "false";
    });
    lift("a", step === 2 || step === 3);
    lift("b", false);
    svg.querySelectorAll('[data-part="cart-b"]').forEach((node) => {
      node.dataset.received = step >= 3 && CHOSEN.includes(Number(node.dataset.index)) ? "true" : "false";
    });

    const capsule = svg.querySelector('[data-part="capsule"]');
    const [from, to] = G.travel;
    const target = step === 3 ? to : from;
    const place = (x) => { capsule.style.transform = `translate(${G.unitX[0] * x}px, ${G.unitX[1] * x}px)`; };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = Number(capsule.dataset.x ?? from);
    let frame = 0;
    let last = 0;
    // Step 4 shows auto-sync: the capsule goes out and comes back with the other side's change.
    let legs = step === 4 && !still ? [to, from] : [target];
    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const goal = legs[0];
      x += (goal - x) * (1 - Math.exp(-dt / 0.42));
      if (Math.abs(goal - x) < 0.2) { x = goal; legs = legs.slice(1); }
      place(x);
      capsule.dataset.x = String(x);
      frame = legs.length ? requestAnimationFrame(tick) : 0;
    };
    if (still) { x = legs[legs.length - 1]; place(x); capsule.dataset.x = String(x); }
    else frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const choose = (index) => { setStep(index); setTouring(false); };
  const current = STEPS[step];

  return (
    <figure
      aria-labelledby={`${id}-title`}
      className={`p2pa m-0 ${className}`}
      data-step={step}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHolding(false); }}
      onFocusCapture={() => setHolding(true)}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHolding(true); }}
      onPointerLeave={() => setHolding(false)}
      ref={rootRef}
    >
      <div className="p2pa-card iso" data-theme="light">
        <div className="p2pa-top">
          <span className="p2pa-fig">Fig. 1</span>
          <span className="p2pa-title" id={`${id}-title`}>Private device sync, taken apart</span>
        </div>
        {/* Static art generated at build time by tools/p2p-anatomy/build.mjs (no user content). */}
        <div className="p2pa-art" dangerouslySetInnerHTML={{ __html: p2pAnatomySvg }} ref={artRef} />
        <div className="p2pa-bottom">
          <span className="p2pa-hint">Pick a step, or let it run</span>
          <span aria-hidden="true" className="p2pa-readout">{current.readout}</span>
        </div>
      </div>

      <div className="p2pa-controls">
        <div aria-label="Sync steps" className="p2pa-steps" role="group">
          {STEPS.map((item, index) => (
            <button aria-controls={`${id}-caption`} aria-pressed={step === index} className="p2pa-step" key={item.label} onClick={() => choose(index)} type="button">
              <span aria-hidden="true">{index + 1}</span>
              {item.label}
            </button>
          ))}
        </div>
        {!reduced ? (
          <button
            aria-label={paused || !touring ? "Play the walkthrough" : "Pause the walkthrough"}
            className="p2pa-play"
            onClick={() => { if (paused || !touring) { setPaused(false); setTouring(true); } else setPaused(true); }}
            type="button"
          >
            {paused || !touring ? <Play aria-hidden="true" size={14} weight="fill" /> : <Pause aria-hidden="true" size={14} weight="fill" />}
          </button>
        ) : null}
      </div>
      <figcaption aria-live={running ? "off" : "polite"} className="p2pa-caption" id={`${id}-caption`}>
        <strong>{current.label}.</strong> {current.caption}
      </figcaption>
    </figure>
  );
}
