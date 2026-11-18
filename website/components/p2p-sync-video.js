"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";

import { P2PSteps, STEPS } from "@/components/p2p-steps";

// When each step starts in the video (motion/p2p-sync/src/lib.rs, STARTS). The last scene is the
// closing card, which keeps step 5 lit.
const STARTS = [0, 4, 8, 12, 16.5];
const SPOKEN = [
  "Pair with a short code or QR: your phone and your child’s device, nothing else.",
  "Check both show the same safety phrase, so you know it’s really their device.",
  "Choose what to share, for example filter words and Kids rules.",
  "It goes straight to their device, locked. No FilterTube server keeps a copy.",
  "Later changes stay in sync. Turn on Auto-sync to keep them matched.",
  "Your devices talk to each other. Nothing in between can read it.",
];

function stepAt(seconds) {
  let index = 0;
  STARTS.forEach((start, i) => { if (seconds >= start) index = i; });
  return index;
}

/**
 * The parent-first explainer for device sync: a 23-second muted video (fframes, motion/p2p-sync)
 * on top, five step buttons that jump to each scene, and a closed "Look inside" panel below with
 * one still diagram per step (components/p2p-steps.js) that follows the same step. Plays only on screen and never starts on its own
 * under reduced motion; the poster shows step 1 and the button plays it on request.
 */
export function P2PSyncExplainer() {
  const videoRef = useRef(null);
  const [wantsPlay, setWantsPlay] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(null);

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

  const jump = (index) => {
    const video = videoRef.current;
    setStep(index);
    setPicked(index);
    if (!video) return;
    if (video.readyState === 0) video.load();
    try { video.currentTime = STARTS[index] + 0.35; } catch { /* seeks once metadata loads */ }
  };

  return (
    <div className="ft-p2p-explainer">
      <figure className="ft-study-loop m-0">
        <div className="ft-study-loop-frame">
          <video
            aria-describedby="p2p-video-caption"
            height={720}
            loop
            muted
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            onTimeUpdate={(event) => setStep(stepAt(event.currentTarget.currentTime))}
            playsInline
            poster="/videos/p2p/p2p-sync-poster.webp"
            preload="metadata"
            ref={videoRef}
            src="/videos/p2p/p2p-sync.mp4"
            width={1280}
          />
          <button
            aria-label={playing ? "Pause the device sync video" : "Play the device sync video"}
            className="ft-study-loop-toggle"
            onClick={toggle}
            type="button"
          >
            {playing ? <Pause aria-hidden="true" size={16} weight="fill" /> : <Play aria-hidden="true" size={16} weight="fill" />}
          </button>
        </div>
        <figcaption className="mt-3 text-sm leading-6 text-[var(--color-muted)]" id="p2p-video-caption">
          How two of your devices sync, in five steps and about 20 seconds. No sound.
          <span className="sr-only"> What the video shows: {SPOKEN.join(" ")}</span>
        </figcaption>
      </figure>

      <div aria-label="Jump to a step in the video" className="p2pa-steps mt-5" role="group">
        {STEPS.map((item, index) => (
          <button aria-pressed={step === index} className="p2pa-step" key={item.label} onClick={() => jump(index)} type="button">
            <span aria-hidden="true">{index + 1}</span>
            {item.label}
          </button>
        ))}
      </div>

      <details className="ft-disclosure mt-8 rounded-[1.2rem] border border-[color:var(--color-line)] bg-[color:var(--color-soft-panel)]">
        <summary className="cursor-pointer px-5 py-4 font-semibold text-[var(--color-ink)]">
          Look inside: the five steps, one at a time
        </summary>
        <div className="px-3 pb-5 md:px-5">
          <P2PSteps activeStep={picked} />
        </div>
      </details>
    </div>
  );
}
