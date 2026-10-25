"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo({
  src,
  className = "absolute inset-0 h-full w-full object-cover",
  poster,
  showControls = false,
  fixedControls = false,
}) {
  const videoRef = useRef(null);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
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
        preload="metadata"
        poster={poster}
        onError={() => setUnavailable(true)}
        src={src}
      />
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
