"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "@phosphor-icons/react";

export function ScreenshotCarousel({ screenshots, label, layout = "phone" }) {
  const viewportRef = useRef(null);
  const groupRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const viewport = viewportRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    const syncVisibility = () => setVisible(onScreen && document.visibilityState === "visible");
    const syncPreference = () => setReducedMotion(preference.matches);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncVisibility();
    }, { threshold: 0.1 });
    observer.observe(viewport);
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    syncPreference();
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!visible || reducedMotion || paused || hovered || focused) return undefined;
    const viewport = viewportRef.current;
    const group = groupRef.current;
    let cycleWidth = 0;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(group.parentElement).columnGap) || 0;
      cycleWidth = group.offsetWidth + gap;
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(group);
    let frame;
    let previousTime;
    let remainder = 0;
    const advance = (time) => {
      if (previousTime !== undefined) {
        remainder += Math.min(time - previousTime, 64) * 0.028;
        const pixels = Math.floor(remainder);
        remainder -= pixels;
        if (pixels && cycleWidth > 0) {
          viewport.scrollLeft += pixels;
          if (viewport.scrollLeft >= cycleWidth) viewport.scrollLeft -= cycleWidth;
        }
      }
      previousTime = time;
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [visible, reducedMotion, paused, hovered, focused]);

  const move = (direction) => {
    setPaused(true);
    const viewport = viewportRef.current;
    const group = groupRef.current;
    const gap = parseFloat(getComputedStyle(group.parentElement).columnGap) || 0;
    const cycle = group.offsetWidth + gap;
    const step = group.firstElementChild.offsetWidth + gap;
    let left = viewport.scrollLeft;
    if (direction < 0 && left < step) {
      left += cycle;
      viewport.scrollLeft = left;
    } else if (direction > 0 && left + step > viewport.scrollWidth - viewport.clientWidth) {
      left -= cycle;
      viewport.scrollLeft = left;
    }
    viewport.scrollTo({ left: left + direction * step, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div
      aria-label={label}
      aria-roledescription="carousel"
      className="ft-screenshot-carousel"
      data-layout={layout}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onFocusCapture={() => setFocused(true)}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      role="region"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]">Swipe to explore. Open any screen for a closer look.</p>
        <div className="flex items-center gap-2">
          <button aria-label="Previous screenshots" className="ft-gallery-control" onClick={() => move(-1)} type="button"><ArrowLeft aria-hidden="true" size={18} /></button>
          {!reducedMotion ? (
            <button aria-pressed={paused} className="ft-gallery-control px-4" onClick={() => { setPaused((value) => !value); setFocused(false); }} type="button">
              {paused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
              {paused ? "Play showcase" : "Pause showcase"}
            </button>
          ) : null}
          <button aria-label="Next screenshots" className="ft-gallery-control" onClick={() => move(1)} type="button"><ArrowRight aria-hidden="true" size={18} /></button>
        </div>
      </div>
      <div
        className="ft-gallery-viewport"
        onPointerDown={() => setPaused(true)}
        onWheel={() => setPaused(true)}
        ref={viewportRef}
      >
        <div className="ft-gallery-track">
          {[0, 1, 2].map((copy) => (
            <div aria-hidden={copy > 0 || undefined} className="ft-gallery-group" key={copy} ref={copy > 0 ? undefined : groupRef}>
              {screenshots.map((screenshot) => (
                <figure className="ft-gallery-slide" key={screenshot.src}>
                  <a
                    aria-label={`Open full screenshot: ${screenshot.title}`}
                    className="block rounded-lg"
                    href={screenshot.src}
                    tabIndex={copy > 0 ? -1 : undefined}
                  >
                    <img
                      alt={copy > 0 ? "" : screenshot.alt}
                      className="h-auto w-full rounded-lg border border-[color:var(--color-line)]"
                      height={screenshot.height || 2400}
                      loading="lazy"
                      src={screenshot.src}
                      width={screenshot.width || 1080}
                    />
                  </a>
                  <figcaption className="mt-5">
                    <h3 className="font-display text-xl text-[var(--color-ink)]">{screenshot.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{screenshot.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
