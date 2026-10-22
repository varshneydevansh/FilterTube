export function getSceneForHour(hour = new Date().getHours()) {
  if (hour >= 20 || hour < 5) return "night";
  if (hour >= 17) return "sunset";
  if (hour >= 10) return "day";
  return "dawn";
}

export function getSystemTheme() {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  } catch (error) {
    return "light";
  }
}

export function applyExtensionEnvironment(surface) {
  const root = document.documentElement;
  const body = document.body;

  if (!root) return;

  root.dataset.scene = getSceneForHour();
  if (!root.dataset.theme) {
    root.dataset.theme = getSystemTheme();
  }
  root.dataset.surface = surface;
  root.style.colorScheme = root.dataset.theme === "dark" ? "dark" : "light";

  if (body) {
    body.dataset.surface = surface;
    body.classList.add("ft-extension-surface");
  }

  if (surface === "popup" && root && body) {
    const availableWidth = window.screen?.availWidth;
    const popupWidth = `${Number.isFinite(availableWidth) && availableWidth > 0 ? Math.min(392, availableWidth) : 392}px`;
    root.style.width = popupWidth;
    root.style.minWidth = "0";
    // Action popups derive their initial viewport from this intrinsic size.
    root.style.maxWidth = popupWidth;
    body.style.width = popupWidth;
    body.style.minWidth = "0";
    body.style.maxWidth = "100%";
    body.style.overflowX = "hidden";

    const popupRoot = document.getElementById("popupRoot");
    if (popupRoot) {
      popupRoot.style.width = popupWidth;
      popupRoot.style.minWidth = "0";
      popupRoot.style.maxWidth = "100%";
      popupRoot.style.display = "block";
    }
  }
}
