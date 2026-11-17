// Full-page captures of the running site through Chrome's DevTools protocol (no extra packages).
//
//   npx next start -p 3125   # in website/, after npm run build
//   node tools/capture-pages.mjs http://localhost:3125 docs/refresh-2026-11-18 \
//     home-1440=/@1440x900 home-390=/@390x844 ios-1440=/ios@1440x900 reduced-home-1440=/@1440x900:reduce
//
// Each job is name=path@WIDTHxHEIGHT, with ":reduce" to emulate prefers-reduced-motion, ":dark"
// for the dark theme, or ":top" for a viewport-only shot. Output is JPEG to keep the repo light.
// Also prints a small audit per page: images without alt, layout shift, and console errors.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const [base, outDir, ...jobs] = process.argv.slice(2);
const chromePath = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9333;
mkdirSync(outDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.HOME}/FilterTubeWorktrees/site-scratch/cdp-profile`, "about:blank",
], { stdio: "ignore" });

let targets;
for (let i = 0; i < 50 && !targets; i += 1) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(200); }
}
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve));
let nextId = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener("message", ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else listeners.forEach((fn) => fn(msg));
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
const errors = [];
listeners.push((msg) => {
  if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.text);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") errors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
});
await send("Page.enable");
await send("Runtime.enable");

for (const job of jobs) {
  const [name, spec] = job.split("=");
  const [pathAndSize, ...flags] = spec.split(":");
  const [path, size] = pathAndSize.split("@");
  const [width, height] = size.split("x").map(Number);
  const mobile = width < 768;
  errors.length = 0;
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-reduced-motion", value: flags.includes("reduce") ? "reduce" : "no-preference" },
    { name: "prefers-color-scheme", value: flags.includes("dark") ? "dark" : "light" },
  ] });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    try { localStorage.setItem("filtertube-theme", "${flags.includes("dark") ? "dark" : "light"}"); } catch {}
    window.__cls = 0;
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
      .observe({ type: "layout-shift", buffered: true });` });
  await send("Page.navigate", { url: base + path });
  await sleep(2500);
  // Scroll through the page so lazy images and in-view effects run, then return to the top.
  const { result: total } = await send("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true });
  for (let y = 0; y < total.value; y += Math.round(height * 0.8)) {
    await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${y})` });
    await sleep(350);
  }
  await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
  await sleep(1500);
  const { result: audit } = await send("Runtime.evaluate", { returnByValue: true, expression: `(() => ({
    height: document.documentElement.scrollHeight,
    cls: Math.round(window.__cls * 1000) / 1000,
    imagesMissingAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).map((img) => img.src),
    imagesMissingSize: [...document.images].filter((img) => !img.getAttribute("width") || !img.getAttribute("height")).map((img) => img.src).slice(0, 8),
    buttonsWithoutName: [...document.querySelectorAll("button")].filter((b) => !(b.getAttribute("aria-label") || b.textContent.trim())).length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    spritesPlaying: [...document.querySelectorAll(".ft-sprite")].map((s) => s.dataset.state),
  }))()` });
  // Chrome renders at most ~16k pixels per capture, so tall pages are saved in parts.
  const fullPage = !flags.includes("top");
  const pageHeight = fullPage ? audit.value.height : height;
  const partHeight = 15000;
  const parts = Math.ceil(pageHeight / partHeight);
  for (let part = 0; part < parts; part += 1) {
    const y = part * partHeight;
    const shot = await send("Page.captureScreenshot", {
      format: "jpeg", quality: 72, captureBeyondViewport: fullPage,
      clip: { x: 0, y, width, height: Math.min(partHeight, pageHeight - y), scale: 1 },
    });
    const file = parts > 1 ? `${name}-part${part + 1}.jpg` : `${name}.jpg`;
    writeFileSync(join(outDir, file), Buffer.from(shot.data, "base64"));
  }
  console.log(JSON.stringify({ name, path, width, flags, ...audit.value, errors: [...errors] }));
}

ws.close();
chrome.kill();
