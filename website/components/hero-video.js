"use client";

import { useEffect, useRef } from "react";

export function HeroVideo({
  src,
  className = "absolute inset-0 h-full w-full object-cover",
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    let visible = true;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPlayback = () => {
      const shouldPlay =
        visible &&
        document.visibilityState === "visible" &&
        !reducedMotionQuery.matches;

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
  }, []);

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      autoPlay
      className={className}
      loop
      muted
      playsInline
      preload="metadata"
      src={src}
    />
  );
}
