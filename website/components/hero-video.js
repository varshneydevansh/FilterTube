"use client";

import { useEffect, useRef, useState } from "react";

// Background motion that costs nothing until it plays. preload="none" plus a poster means the
// video downloads only when it is about to play. It never autoplays with reduced motion; on
// phone-width screens and Save-Data connections it starts paused, showing the poster, and the
// "Play background motion" button starts it.
const AUTOPLAY_OFF_QUERY = "(max-width: 767px)";

function shouldStartPaused() {
  return window.matchMedia(AUTOPLAY_OFF_QUERY).matches || navigator.connection?.saveData === true;
}

export function HeroVideo({
  src,
  webmSrc,
  className = "absolute inset-0 h-full w-full object-cover",
  poster,
  showControls = false,
  fixedControls = false,
}) {
  const videoRef = useRef(null);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const startDecided = useRef(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    if (!startDecided.current) {
      startDecided.current = true;
      if (shouldStartPaused()) {
        // Re-runs this effect with userPaused set, before anything is downloaded.
        setUserPaused(true);
        return undefined;
      }
    }

    let visible = false;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPlayback = () => {
      setReducedMotion(reducedMotionQuery.matches);
      const shouldPlay =
        visible &&
        document.visibilityState === "visible" &&
        !reducedMotionQuery.matches &&
        !userPaused;

      if (shouldPlay) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.08 },
    );

    observer.observe(video);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotionQuery.addEventListener("change", syncPlayback);
    syncPlayback();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotionQuery.removeEventListener("change", syncPlayback);
    };
  }, [src, userPaused]);

  return (
    <>
      <video
        ref={videoRef}
        aria-hidden="true"
        className={className}
        loop
        muted
        playsInline
        preload="none"
        poster={poster}
        onError={() => setUnavailable(true)}
      >
        {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
        {/* onError on <video> does not fire for <source> failures; the last source reports it. */}
        <source src={src} type="video/mp4" onError={() => setUnavailable(true)} />
      </video>
      {showControls && !reducedMotion && !unavailable ? (
        <button
          aria-pressed={userPaused}
          className={`ft-shell-strong ${fixedControls ? "fixed" : "absolute"} bottom-5 right-5 z-20 min-h-11 rounded-full border border-[color:var(--color-line)] px-4 text-xs text-[var(--color-ink)]`}
          onClick={() => setUserPaused((paused) => !paused)}
          type="button"
        >
          {userPaused ? "Play background motion" : "Pause background motion"}
        </button>
      ) : null}
    </>
  );
}
