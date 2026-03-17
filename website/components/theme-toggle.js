"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

const storageKey = "filtertube-theme";
const themeSyncEvent = "filtertube:theme-change";

function normalizeThemePreference(themePreference) {
  return themePreference === "dark" ? "dark" : "light";
}

function applyTheme(themePreference) {
  const root = document.documentElement;
  const resolvedTheme = normalizeThemePreference(themePreference);

  root.dataset.themePreference = resolvedTheme;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

function getStoredThemePreference() {
  if (typeof window === "undefined") {
    return "light";
  }

  return normalizeThemePreference(
    window.localStorage.getItem(storageKey) ??
      document.documentElement.dataset.themePreference ??
      "light",
  );
}

export function ThemeToggle({ mobile = false }) {
  const [themePreference, setThemePreference] = useState("light");

  useEffect(() => {
    const syncPreference = () => {
      const nextPreference = getStoredThemePreference();
      setThemePreference(nextPreference);
      applyTheme(nextPreference);
    };

    syncPreference();

    const handleStorage = (event) => {
      if (!event.key || event.key === storageKey) {
        syncPreference();
      }
    };
    const handleThemeSync = (event) => {
      const nextPreference = normalizeThemePreference(
        event.detail?.themePreference ?? getStoredThemePreference(),
      );
      setThemePreference(nextPreference);
      applyTheme(nextPreference);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(themeSyncEvent, handleThemeSync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(themeSyncEvent, handleThemeSync);
    };
  }, []);

  function handleThemeChange(nextTheme) {
    const resolvedTheme = normalizeThemePreference(nextTheme);
    setThemePreference(resolvedTheme);
    window.localStorage.setItem(storageKey, resolvedTheme);
    applyTheme(resolvedTheme);
    window.dispatchEvent(
      new CustomEvent(themeSyncEvent, {
        detail: { themePreference: resolvedTheme },
      }),
    );
  }

  const nextTheme = themePreference === "dark" ? "light" : "dark";
  const nextLabel =
    nextTheme === "dark" ? "Switch to dark mode" : "Switch to light mode";
  const ToggleIcon = nextTheme === "dark" ? Moon : Sun;

  return (
    <button
      aria-label={nextLabel}
      aria-pressed={themePreference === "dark"}
      className={`pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border border-[color:var(--color-line)] ft-shell-strong p-1 text-[var(--color-ink)] shadow-[0_18px_40px_-34px_rgba(15,18,28,0.35)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:text-[var(--color-accent)] active:translate-y-px active:scale-[0.98] ${
        mobile ? "self-start" : ""
      }`}
      onClick={() => handleThemeChange(nextTheme)}
      title={nextLabel}
      type="button"
    >
      <span className="ft-tile flex h-9 w-9 items-center justify-center rounded-[0.8rem] shadow-[0_14px_28px_-20px_rgba(17,18,24,0.28)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <ToggleIcon
          aria-hidden="true"
          className="transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          size={16}
          weight="light"
        />
      </span>
      <span className="sr-only">{nextLabel}</span>
    </button>
  );
}
