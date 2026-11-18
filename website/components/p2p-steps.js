"use client";

import { useEffect, useId, useState } from "react";

// The five device sync steps, shared with the video above them (components/p2p-sync-video.js).
// Facts follow docs/app/TECHNICAL_RUNTIME.md (Nanah): a 4-character code or QR, a safety phrase
// compared on both screens, a chosen share, a locked direct connection, and opt-in Auto-sync.
export const STEPS = [
  {
    label: "Pair",
    sentence: "Show a short code or QR on one device, and enter it on the other.",
  },
  {
    label: "Verify",
    sentence: "Both screens show the same safety phrase. If it matches, it’s really your device.",
  },
  {
    label: "Choose",
    sentence: "Pick what to share, like your filters or Kids rules.",
  },
  {
    label: "Send",
    sentence:
      "It goes straight to the other device, locked so only these two can open it. A relay can help the devices find each other; it only passes locked data it can’t open.",
  },
  {
    label: "Stay in sync",
    sentence: "With Auto-sync on, later changes follow on their own.",
  },
];

const INK = "currentColor";

/** A plain device outline with its screen content. `x` is the left edge. */
function Device({ x, y = 34, w, h, r, children }) {
  return (
    <g>
      <rect fill="var(--p2ps-device)" height={h} rx={r} width={w} x={x} y={y} />
      <rect fill="var(--p2ps-screen)" height={h - 16} rx={r - 6} width={w - 16} x={x + 8} y={y + 8} />
      {children}
    </g>
  );
}

const PHONE = { x: 40, w: 172, h: 232, r: 26 };
const TABLET = { x: 380, w: 200, h: 232, r: 20 };
const phoneCx = PHONE.x + PHONE.w / 2;
const tabletCx = TABLET.x + TABLET.w / 2;

function Words({ cx, words, highlight = -1 }) {
  return words.map((word, index) => (
    <g key={word}>
      <rect
        fill={index === highlight ? "var(--p2ps-accent-soft)" : "var(--p2ps-chip)"}
        height="40"
        rx="20"
        stroke={index === highlight ? "var(--p2ps-accent)" : "var(--p2ps-line)"}
        width="150"
        x={cx - 75}
        y={70 + index * 52}
      />
      <text fill={INK} fontSize="25" textAnchor="middle" x={cx} y={99 + index * 52}>{word}</text>
    </g>
  ));
}

function Tick({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} fill="var(--p2ps-ok)" r="16" />
      <path d={`M${cx - 7} ${cy} l5 5 l9 -10`} fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </g>
  );
}

function Arrow({ twoWay = false }) {
  return (
    <g fill="none" stroke="var(--p2ps-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
      <path d="M226 150 H366" />
      <path d="M356 140 l10 10 l-10 10" />
      {twoWay ? <path d="M236 140 l-10 10 l10 10" /> : null}
    </g>
  );
}

function Lock({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} fill="var(--p2ps-screen)" r="30" stroke="var(--p2ps-accent)" strokeWidth="2" />
      <path d={`M${cx - 8} ${cy - 3} v-6 a8 8 0 0 1 16 0 v6`} fill="none" stroke="var(--p2ps-accent)" strokeWidth="3" />
      <rect fill="var(--p2ps-accent)" height="17" rx="3" width="24" x={cx - 12} y={cy - 4} />
    </g>
  );
}

function Diagram({ step }) {
  const phone = (content) => <Device {...PHONE}>{content}</Device>;
  const tablet = (content) => <Device {...TABLET}>{content}</Device>;
  switch (step) {
    case 0:
      return (
        <>
          {phone(<text fill={INK} fontSize="34" letterSpacing="5" textAnchor="middle" x={phoneCx} y="160">K7QM</text>)}
          {tablet(<text fill={INK} fontSize="34" letterSpacing="5" textAnchor="middle" x={tabletCx} y="160">K7QM</text>)}
          <path d="M228 150 H364" fill="none" stroke="var(--p2ps-line-strong)" strokeDasharray="2 10" strokeLinecap="round" strokeWidth="3" />
        </>
      );
    case 1:
      return (
        <>
          {phone(<Words cx={phoneCx} words={["otter", "lantern", "maple"]} />)}
          {tablet(<Words cx={tabletCx} words={["otter", "lantern", "maple"]} />)}
          <Tick cx={296} cy={150} />
        </>
      );
    case 2:
      return (
        <>
          {phone(
            [["Filters", true], ["Kids rules", true], ["Notes", false]].map(([label, on], index) => (
              <g key={label}>
                <rect fill={on ? "var(--p2ps-ok)" : "none"} height="18" rx="4" stroke={on ? "var(--p2ps-ok)" : "var(--p2ps-line-strong)"} strokeWidth="2" width="20" x={PHONE.x + 20} y={84 + index * 52} />
                {on ? <path d={`M${PHONE.x + 25} ${94 + index * 52} l4 4 l8 -9`} fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2.5" /> : null}
                <text fill={INK} fontSize="23" x={PHONE.x + 48} y={101 + index * 52}>{label}</text>
              </g>
            )),
          )}
          {tablet(null)}
        </>
      );
    case 3:
      return (
        <>
          {phone(<text fill={INK} fontSize="26" textAnchor="middle" x={phoneCx} y="159">Sending</text>)}
          {tablet(<text fill={INK} fontSize="26" textAnchor="middle" x={tabletCx} y="159">Received</text>)}
          <Arrow />
          <Lock cx={296} cy={150} />
        </>
      );
    default:
      return (
        <>
          {phone(<Words cx={phoneCx} highlight={2} words={["scary", "horror", "jumpscare"]} />)}
          {tablet(<Words cx={tabletCx} highlight={2} words={["scary", "horror", "jumpscare"]} />)}
          <Arrow twoWay />
        </>
      );
  }
}

/**
 * "Look inside": one calm diagram per step. Two devices, one sign between them, one sentence.
 * Switching steps crossfades the diagrams; with reduced motion the change is instant.
 */
export function P2PSteps({ activeStep = null }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (activeStep !== null && activeStep !== undefined) setStep(activeStep);
  }, [activeStep]);

  return (
    <figure className="p2ps m-0" aria-labelledby={`${id}-sentence`}>
      <div className="p2ps-stage">
        {STEPS.map((item, index) => (
          <svg
            aria-hidden={step !== index}
            className="p2ps-diagram"
            data-on={step === index}
            fontFamily="inherit"
            key={item.label}
            role="img"
            aria-label={`${item.label}: ${item.sentence}`}
            viewBox="0 0 620 300"
          >
            <Diagram step={index} />
          </svg>
        ))}
        <div className="p2ps-labels" aria-hidden="true">
          <span>Your phone</span>
          <span>Your child’s tablet</span>
        </div>
      </div>
      <div aria-label="Sync steps" className="p2pa-steps mt-4" role="group">
        {STEPS.map((item, index) => (
          <button aria-controls={`${id}-sentence`} aria-pressed={step === index} className="p2pa-step" key={item.label} onClick={() => setStep(index)} type="button">
            <span aria-hidden="true">{index + 1}</span>
            {item.label}
          </button>
        ))}
      </div>
      <figcaption aria-live="polite" className="p2ps-sentence" id={`${id}-sentence`}>
        <strong>{STEPS[step].label}.</strong> {STEPS[step].sentence}
      </figcaption>
    </figure>
  );
}
