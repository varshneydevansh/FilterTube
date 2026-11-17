"use client";

import { useEffect, useRef, useState } from "react";

import { motions } from "@/data/mascots";

/**
 * Plays a Kriti and Uljhan strip with CSS steps() once it scrolls into view.
 * It plays `loops` times (short enough to stay under five seconds of automatic motion),
 * then rests on its still frame. Selecting it plays it again. With reduced motion it
 * never moves and shows the still frame.
 */
export function MascotSprite({ motion, loops = 2, className = "", replayLabel }) {
  const art = motions[motion];
  const ref = useRef(null);
  const [state, setState] = useState("idle"); // idle -> playing -> rest

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      setState("rest");
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setState((current) => (current === "idle" ? "playing" : current));
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!art) return null;
  const replay = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setState("rest");
    requestAnimationFrame(() => requestAnimationFrame(() => setState("playing")));
  };

  const style = {
    "--sprite-frames": art.frames,
    "--sprite-still": art.still,
    "--sprite-duration": `${(art.frames / art.fps).toFixed(2)}s`,
    "--sprite-loops": loops,
    aspectRatio: `${art.frameWidth} / ${art.height}`,
  };

  return (
    <button
      aria-label={replayLabel || `Play again: ${art.alt}`}
      className={`ft-sprite ${className}`}
      data-state={state}
      onClick={replay}
      ref={ref}
      style={style}
      type="button"
    >
      <img
        alt=""
        className="ft-sprite-strip"
        decoding="async"
        draggable="false"
        height={art.height}
        loading="lazy"
        onAnimationEnd={() => setState("rest")}
        src={art.src}
        width={art.frameWidth * art.frames}
      />
    </button>
  );
}
