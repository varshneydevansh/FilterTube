"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "@phosphor-icons/react";
import { ScreenshotViewer } from "@/components/screenshot-viewer";

export function ScreenshotCarousel({ screenshots, label, layout = "phone" }) {
  const [viewerIndex, setViewerIndex] = useState(null);
  const browserRail = layout === "browser";
  const noun = browserRail ? "browsers" : "screenshots";
  const viewportRef = useRef(null);
  const groupRef = useRef(null);
  const trackRef = useRef(null);
  const motionRef = useRef({ player: null, cycle: 0, duration: 0 });
  const playingRef = useRef(false);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const savedOffsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resume, setResume] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [motionOptIn, setMotionOptIn] = useState(false);
  const staticView = screenshots.length < 2 || (reducedMotion && !motionOptIn);
  const status = staticView ? (screenshots.length < 2 ? "1 screen" : "Reduced motion")
    : viewerIndex !== null ? "Paused while viewing" : paused ? "Paused" : dragging ? "Paused while dragging"
    : focused && !resume ? "Paused for keyboard"
    : hovered && !resume ? "Paused while reading"
    : visible ? "Playing" : "Ready";
  const playing = status === "Playing";

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    const syncVisibility = () => setVisible(onScreen && document.visibilityState === "visible");
    const syncPreference = () => { setReducedMotion(preference.matches); setMotionOptIn(false); setResume(false); };
    const finishDrag = () => { dragRef.current = null; setDragging(false); };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncVisibility();
    }, { threshold: 0.1 });
    observer.observe(viewportRef.current);
    preference.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    window.addEventListener("blur", finishDrag);
    syncPreference();
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      window.removeEventListener("blur", finishDrag);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (staticView) {
      viewport.scrollLeft = savedOffsetRef.current;
      return undefined;
    }
    const group = groupRef.current;
    const track = trackRef.current;
    const measure = () => {
      track.style.setProperty("--rail-min-width", `${viewport.clientWidth}px`);
      const cycle = group.offsetWidth;
      const previous = motionRef.current;
      if (!cycle || previous.cycle === cycle) return;
      const phase = previous.duration ? (Number(previous.player?.currentTime || 0) % previous.duration) / previous.duration
        : viewport.scrollLeft / cycle;
      viewport.scrollLeft = 0;
      previous.player?.cancel();
      const duration = cycle / 40 * 1000;
      const player = track.animate([
        { transform: "translateX(0)" },
        { transform: `translateX(-${cycle}px)` },
      ], { duration, iterations: Infinity, easing: "linear" });
      player.pause();
      player.currentTime = phase * duration;
      motionRef.current = { player, cycle, duration };
      if (playingRef.current) player.play();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(group);
    return () => {
      observer.disconnect();
      const { player, cycle, duration } = motionRef.current;
      if (duration) savedOffsetRef.current = (Number(player?.currentTime || 0) % duration) / duration * cycle;
      player?.cancel();
      motionRef.current = { player: null, cycle: 0, duration: 0 };
    };
  }, [screenshots, layout, staticView]);

  useEffect(() => {
    playingRef.current = playing;
    const player = motionRef.current.player;
    if (playing) player?.play(); else player?.pause();
  }, [playing, staticView]);

  const position = () => {
    const { player, cycle, duration } = motionRef.current;
    return duration ? (Number(player?.currentTime || 0) % duration) / duration * cycle : 0;
  };
  const seek = (offset) => {
    const { player, cycle, duration } = motionRef.current;
    if (player && cycle) player.currentTime = ((offset % cycle + cycle) % cycle) / cycle * duration;
  };
  const showScreen = (index) => {
    const slide = groupRef.current.children[index];
    const offset = Math.max(0, slide.offsetLeft - groupRef.current.offsetLeft - 16);
    if (staticView) viewportRef.current.scrollTo({ left: offset, behavior: "auto" });
    else { viewportRef.current.scrollLeft = 0; seek(offset); }
  };
  const move = (direction) => {
    setPaused(true);
    setResume(false);
    const offset = staticView ? viewportRef.current.scrollLeft : position();
    const slides = [...groupRef.current.children];
    let current = 0;
    slides.forEach((slide, index) => { if (slide.offsetLeft - groupRef.current.offsetLeft - 16 <= offset + 1) current = index; });
    const viewport = viewportRef.current;
    if (staticView && offset > 0 && offset >= viewport.scrollWidth - viewport.clientWidth - 1) current = screenshots.length - 1;
    showScreen((current + direction + screenshots.length) % screenshots.length);
  };

  return (
    <div aria-label={label} aria-roledescription="carousel" className="ft-screenshot-carousel" data-layout={layout} data-static={staticView} data-state={status} role="region"
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onFocusCapture={(event) => {
        const keyboard = event.target.matches(":focus-visible");
        setFocused(keyboard);
        if (!keyboard) return;
        setResume(false);
        const index = event.target.dataset.screenIndex;
        if (index !== undefined) showScreen(Number(index));
      }}
    >
      <div className="ft-gallery-toolbar mx-auto mb-5 flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 md:px-6">
        <p className="text-sm text-[var(--color-muted)]">{screenshots.length} {browserRail ? "desktop browsers · Choose your install path." : `${screenshots.length === 1 ? "screen" : "screens"} · Open a screen for a closer look.`}</p>
        {screenshots.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-xs text-[var(--color-muted)]" role="status">{status}</span>
            <button aria-label={`Previous ${noun}`} className="ft-gallery-control" onClick={() => move(-1)} type="button"><ArrowLeft aria-hidden="true" size={18} /></button>
            <button className="ft-gallery-control px-4" onClick={() => {
              if (playing) { setPaused(true); setResume(false); }
              else { setPaused(false); setMotionOptIn(true); setResume(true); }
            }} type="button">
              {playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
              {playing ? (browserRail ? "Pause browsers" : "Pause showcase") : (browserRail ? "Play browsers" : "Play showcase")}
            </button>
            <button aria-label={`Next ${noun}`} className="ft-gallery-control" onClick={() => move(1)} type="button"><ArrowRight aria-hidden="true" size={18} /></button>
          </div>
        ) : null}
      </div>
      <div
        className="ft-gallery-viewport"
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
        onPointerLeave={() => { setHovered(false); setResume(false); }}
        onPointerDown={(event) => {
          suppressClickRef.current = false;
          if (staticView || event.button !== 0) return;
          dragRef.current = { x: event.clientX, y: event.clientY, offset: position(), moved: false };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          const delta = event.clientX - drag.x;
          if (!drag.moved && (Math.abs(delta) < 8 || Math.abs(delta) < Math.abs(event.clientY - drag.y))) return;
          drag.moved = true;
          setDragging(true);
          suppressClickRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setPaused(true); setResume(false);
          seek(drag.offset - delta);
        }}
        onPointerUp={() => { dragRef.current = null; setDragging(false); }}
        onPointerCancel={() => { dragRef.current = null; setDragging(false); }}
        onLostPointerCapture={() => { dragRef.current = null; setDragging(false); }}
        onClickCapture={(event) => { if (suppressClickRef.current) { event.preventDefault(); event.stopPropagation(); suppressClickRef.current = false; } }}
        onWheel={(event) => {
          if (!staticView && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            setPaused(true); setResume(false); seek(position() + event.deltaX);
          }
        }}
        ref={viewportRef}
      >
        <div className="ft-gallery-track" ref={trackRef}>
          {[0, 1].map((copy) => (
            <div aria-hidden={copy > 0 || undefined} className={`ft-gallery-group${copy ? " ft-gallery-copy" : ""}`} key={copy} ref={copy ? undefined : groupRef}>
              {screenshots.map((screenshot, index) => (
                <figure className="ft-gallery-slide" key={screenshot.src}>
                  {browserRail ? (
                    <a className="ft-browser-carousel-link" aria-label={`${screenshot.title}: ${screenshot.note}`} data-screen-index={index} href={screenshot.href} rel="noreferrer" target="_blank" tabIndex={copy ? -1 : undefined} draggable="false">
                      <img alt="" src={screenshot.src} width={44} height={44} loading="lazy" draggable="false" />
                      <span>{screenshot.title}</span>
                      <small>{screenshot.note}</small>
                    </a>
                  ) : <>
                  <button type="button" aria-label={`Open full screenshot: ${screenshot.title}`} className="block w-full cursor-zoom-in rounded-lg" data-screen-index={index} onClick={() => setViewerIndex(index)} tabIndex={copy ? -1 : undefined} draggable="false">
                    <img alt={copy ? "" : screenshot.alt} className="ft-gallery-image rounded-lg border border-[color:var(--color-line)]" draggable="false" height={screenshot.height || 2400} loading="lazy" src={screenshot.src} width={screenshot.width || 1080} />
                  </button>
                  <figcaption className="mt-4 text-center">
                    <h3 className="font-display text-base text-[var(--color-ink)]">{screenshot.title}</h3>
                  </figcaption>
                  </>}
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
      {viewerIndex !== null && !browserRail ? <ScreenshotViewer screens={screenshots} index={viewerIndex} onNavigate={setViewerIndex} onClose={() => setViewerIndex(null)} /> : null}
    </div>
  );
}
