"use client";

import { useEffect, useEffectEvent } from "react";

const sceneBoundaries = [
  { hour: 5, scene: "dawn" },
  { hour: 10, scene: "day" },
  { hour: 17, scene: "sunset" },
  { hour: 20, scene: "night" },
];

function getSceneForHour(hour) {
  if (hour >= 20 || hour < 5) {
    return "night";
  }
  if (hour >= 17) {
    return "sunset";
  }
  if (hour >= 10) {
    return "day";
  }
  return "dawn";
}

function getNextSceneBoundary(now) {
  const nextBoundary = sceneBoundaries.find(({ hour }) => now.getHours() < hour);
  if (nextBoundary) {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      nextBoundary.hour,
      0,
      0,
      0,
    );
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    sceneBoundaries[0].hour,
    0,
    0,
    0,
  );
}

export function SceneController() {
  const applyScene = useEffectEvent(() => {
    const root = document.documentElement;
    const now = new Date();
    root.dataset.scene = getSceneForHour(now.getHours());
  });

  useEffect(() => {
    let timeoutId;

    const scheduleNextUpdate = () => {
      const now = new Date();
      const nextBoundary = getNextSceneBoundary(now);
      timeoutId = window.setTimeout(() => {
        applyScene();
        scheduleNextUpdate();
      }, nextBoundary.getTime() - now.getTime() + 250);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timeoutId);
        applyScene();
        scheduleNextUpdate();
      }
    };

    applyScene();
    scheduleNextUpdate();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
