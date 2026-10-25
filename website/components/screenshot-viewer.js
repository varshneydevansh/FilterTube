"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";

export function ScreenshotViewer({ screens, index, onNavigate, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [failedSource, setFailedSource] = useState(null);
  const screen = screens[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const move = (direction) => onNavigate((index + direction + screens.length) % screens.length);

  return (
    <dialog className="ft-screenshot-viewer" ref={dialogRef} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const controls = event.currentTarget.querySelectorAll("button:not([disabled])");
          const first = controls[0];
          const last = controls[controls.length - 1];
          if ((event.shiftKey && event.target === first) || (!event.shiftKey && event.target === last)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          }
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="ft-viewer-content">
        <header className="ft-viewer-header">
          <div className="min-w-0">
            <h2 className="font-display text-lg" id={titleId}>{screen.title}</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]" aria-live="polite">{index + 1} of {screens.length}</p>
          </div>
          <button className="ft-gallery-control" type="button" aria-label="Close screenshot" onClick={onClose}><X aria-hidden="true" size={22} /></button>
        </header>
        <div className="ft-viewer-image">
          {failedSource === screen.src ? <p>This screenshot could not be loaded.</p> : (
            <img alt={screen.alt || screen.title} src={screen.src} width={screen.width} height={screen.height}
              onError={() => setFailedSource(screen.src)} />
          )}
        </div>
        {screens.length > 1 ? (
          <nav className="ft-viewer-navigation" aria-label="Screenshot navigation">
            <button className="ft-gallery-control px-4" type="button" aria-label="Previous screenshot" onClick={() => move(-1)}><ArrowLeft aria-hidden="true" size={18} />Previous</button>
            <button className="ft-gallery-control px-4" type="button" aria-label="Next screenshot" onClick={() => move(1)}>Next<ArrowRight aria-hidden="true" size={18} /></button>
          </nav>
        ) : null}
      </div>
    </dialog>
  );
}
