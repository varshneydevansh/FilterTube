"use client";

import { useState } from "react";
import { ArrowsOut } from "@phosphor-icons/react";
import { ScreenshotViewer } from "@/components/screenshot-viewer";

// Hallmark · pre-emit critique: P5 H4 E4 S5 R5 V4
// Positions: three screens fan out (center, left, right). The "tv-phone" layout pairs a wide TV
// screen behind a phone in front, so a big-screen and a handheld view read as one family.
function positionFor(layout, index) {
  if (layout === "tv-phone") return index === 0 ? "tv" : "phone";
  return index === 0 ? "center" : index === 1 ? "left" : "right";
}

export function AppScreenStack({ screens: allScreens, label, layout = "phone" }) {
  const screens = allScreens.filter(Boolean);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState(null);
  const [failed, setFailed] = useState({});
  const current = preview ?? selected;

  return (
    <figure className="ft-screen-showcase" aria-label={label} data-layout={layout}>
      <div className="ft-screen-stack" onPointerLeave={() => setPreview(null)}>
        {screens.map((screen, index) => (
          <button
            aria-label={`Preview ${screen.title}`}
            aria-pressed={selected === index}
            className="ft-stack-screen"
            data-position={positionFor(layout, index)}
            data-front={current === index}
            key={screen.src}
            onBlur={() => setPreview(null)}
            onClick={() => { setSelected(index); setViewerIndex(index); }}
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
          <button type="button" className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs underline underline-offset-4" onClick={() => setViewerIndex(current)}>
            View full screen: {screens[current].title}
            <ArrowsOut aria-hidden="true" size={14} />
          </button>
        ) : null}
      </figcaption>
      {viewerIndex !== null ? <ScreenshotViewer screens={screens} index={viewerIndex} onNavigate={setViewerIndex} onClose={() => setViewerIndex(null)} /> : null}
    </figure>
  );
}
