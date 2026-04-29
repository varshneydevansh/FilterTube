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
    const popupWidth = "392px";
    root.style.width = popupWidth;
    root.style.minWidth = popupWidth;
    root.style.maxWidth = popupWidth;
    body.style.width = popupWidth;
    body.style.minWidth = popupWidth;
    body.style.maxWidth = popupWidth;
    body.style.overflowX = "hidden";

    const popupRoot = document.getElementById("popupRoot");
    if (popupRoot) {
      popupRoot.style.width = popupWidth;
      popupRoot.style.minWidth = popupWidth;
      popupRoot.style.maxWidth = popupWidth;
      popupRoot.style.display = "block";
    }
  }
}
