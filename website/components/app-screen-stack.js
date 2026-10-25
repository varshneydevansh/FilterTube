"use client";

import { useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";

// Hallmark · pre-emit critique: P5 H4 E4 S5 R5 V4
export function AppScreenStack({ screens, label }) {
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState(null);
  const [failed, setFailed] = useState({});
  const current = preview ?? selected;

  return (
    <figure className="ft-screen-showcase" aria-label={label}>
      <div className="ft-screen-stack" onPointerLeave={() => setPreview(null)}>
        {screens.map((screen, index) => (
          <button
            aria-label={`Preview ${screen.title}`}
            aria-pressed={selected === index}
            className="ft-stack-screen"
            data-position={index === 0 ? "center" : index === 1 ? "left" : "right"}
            data-front={current === index}
            key={screen.src}
            onBlur={() => setPreview(null)}
            onClick={() => setSelected(index)}
            onFocus={() => setPreview(index)}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setPreview(index);
            }}
            type="button"
          >
            {failed[index] ? (
              <span className="ft-stack-unavailable">{screen.title}<br />Preview unavailable</span>
            ) : (
              <img
                alt={screen.alt}
                draggable="false"
                fetchPriority={index === 0 ? "high" : "auto"}
                height={screen.height}
                onError={() => setFailed((previous) => ({ ...previous, [index]: true }))}
                src={screen.src}
                width={screen.width}
              />
            )}
          </button>
        ))}
      </div>
      <figcaption className="ft-stack-caption">
        <p className="text-xs leading-6 text-[var(--color-muted)]">{label}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {screens.map((screen, index) => (
            <button
              aria-pressed={selected === index}
              className="ft-stack-choice"
              key={screen.src}
              onClick={() => { setSelected(index); setPreview(null); }}
              type="button"
            >
              {screen.title}
            </button>
          ))}
        </div>
        {!failed[current] ? (
          <a className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs underline underline-offset-4" href={screens[current].src}>
            View full screen: {screens[current].title}
            <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
