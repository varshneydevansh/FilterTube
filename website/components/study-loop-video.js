"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";

/**
 * The 12-second Study loop rendered with fframes (motion/study-loop). Muted, plays only while on
 * screen, and never starts on its own under reduced motion: the poster shows the first stage and
 * the button lets the visitor choose to play it.
 */
export function StudyLoopVideo({ className = "" }) {
  const videoRef = useRef(null);
  const [wantsPlay, setWantsPlay] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      const allowed = wantsPlay || (!reduce.matches && !userPaused);
      if (visible && allowed && !userPaused && document.visibilityState === "visible") {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.35 });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
    };
  }, [wantsPlay, userPaused]);

  const toggle = () => {
    if (playing) {
      setUserPaused(true);
      setWantsPlay(false);
    } else {
      setUserPaused(false);
      setWantsPlay(true);
    }
  };

  return (
    <figure className={`ft-study-loop ${className}`}>
      <div className="ft-study-loop-frame">
        <video
          aria-describedby="study-loop-caption"
          height={540}
          loop
          muted
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          playsInline
          poster="/videos/study/study-loop-poster.jpg"
          preload="none"
          ref={videoRef}
          src="/videos/study/study-loop.mp4"
          width={960}
        />
        <button
          aria-label={playing ? "Pause the study session clip" : "Play the study session clip"}
          className="ft-study-loop-toggle"
          onClick={toggle}
          type="button"
        >
          {playing ? <Pause aria-hidden="true" size={16} weight="fill" /> : <Play aria-hidden="true" size={16} weight="fill" />}
        </button>
      </div>
      <figcaption className="mt-3 text-sm leading-6 text-[var(--color-muted)]" id="study-loop-caption">
        One session on a real Pixel, in twelve seconds: a round with only your plan’s channels,
        comments off while you study, a break, then “That counts”. No sound.
      </figcaption>
    </figure>
  );
}
