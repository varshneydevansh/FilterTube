// Builds the isometric P2P sync figure for the home page with the Anatomy kit (kit/, MIT).
//
//   node tools/p2p-anatomy/build.mjs          # writes components/p2p-anatomy-art.js
//   node tools/p2p-anatomy/build.mjs --page   # also writes a standalone preview page here
//
// The object: two device docks on one bench, joined by a sealed rail. A code drum and three
// safety-phrase lamps sit on each dock; three cartridges (settings, rules, notes) sit in the
// sender's tray; a locked capsule rides the rail from one dock to the other. Behind the rail a
// small relay mast is wired to both docks: it only helps them find each other, and the capsule
// never stops there. Parts that move or light are tagged with data-part for the live component.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as k from "./kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const WIDTH = 720;
const HEIGHT = 372;

// World plan (units ~ px; x to the right, y toward the viewer, z up).
const BASE = { x: -186, y: -64, w: 372, d: 128, r: 9 };
const BASE_H = 10;
const FOOT_H = 5;
const DOCK_H = 14;
const DOCKS = {
  a: { x: -176, y: -50, w: 92, d: 98, r: 6 },
  b: { x: 84, y: -50, w: 92, d: 98, r: 6 },
};
const RAIL = { from: -84, to: 84, y: 8, d: 16, z: 14 };
const CAPSULE_W = 24;
const TRAVEL = [-66, 66]; // capsule centre at the two docks
const MAST = [0, -40];
const MAST_TOP = 74;

const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [MAST[0], MAST[1], MAST_TOP + 10], [DOCKS.a.x, DOCKS.a.y, 40], [DOCKS.b.x + DOCKS.b.w, DOCKS.b.y + DOCKS.b.d, 30]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 68 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const fine = (n) => Math.round(n * 100) / 100;
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const screenVec = (v) => k.axisVector(P, v).map(fine);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 24))) {
    out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6.2, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(BASE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler strip along the front edge, ticks every 4 with a major every 5th.
  const strip = { x: -150, y: BASE.y + BASE.d - 13, w: 300, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.45 }));
  // Label plate with an engraved mark and three rule lines.
  const label = { x: -36, y: 28, w: 72, d: 18, r: 2 };
  out.push(S(k.slabOf(label, 0, 1, P, 4, 0.3), { tone: "mid" }));
  out.push(D(k.corners(label, 2.6).map(([x, y]) => at([x, y, 1])), { size: 0.4 }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 7, label.y + 7.4], 1, P, "x"), "P2P · DIRECT", { size: 4.2, tone: "mid" }));
  for (const [i, w] of [[0, 54], [1, 40], [2, 48]]) {
    out.push(L(k.lineOnTop([label.x + 7, label.y + 10.5 + i * 2.4], [label.x + 7 + w, label.y + 10.5 + i * 2.4], 1, P), { tone: "faint", free: "both" }));
  }
  return out.join("");
}

// The relay mast stands behind the rail. Its wires carry only the introduction.
function mast() {
  const [x, y] = MAST;
  const out = [];
  out.push(S(k.cylinder(x, y, 9, 0, 2, P, 32, 0.4), { tone: "mid" }));
  out.push(D(k.circleRing(x, y, 6.6, 6).map(([px, py]) => at([px, py, 2])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 2.2, 2, MAST_TOP - 2, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([24, 48].map((z) => k.sideArc(x, y, 2.2, z, P, 12)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, 6, MAST_TOP, 7, P, 28, 0.5), { tone: "mid" }));
  out.push(`<g data-part="relay-lamp">${S(k.cylinder(x, y, 4.4, MAST_TOP + 7, 4, P, 28), { tone: "hi" })}</g>`);
  out.push(S(k.cylinder(x, y, 6.6, MAST_TOP + 11, 1.6, P, 28, 0.4), { tone: "mid" }));
  // An empty open tray on the mast: nothing is kept here.
  const tray = { x: x - 9, y: y + 6, w: 18, d: 9, r: 1.5 };
  out.push(S(k.slabOf(tray, 30, 1.2, P, 3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(tray, 1.6), 31.2, P, 3), { tone: "lo" }));
  return out.join("");
}

function mastWires() {
  const top = at([MAST[0], MAST[1], MAST_TOP + 3]);
  const toA = at([DOCKS.a.x + DOCKS.a.w - 6, DOCKS.a.y + 10, DOCK_H]);
  const toB = at([DOCKS.b.x + 6, DOCKS.b.y + 10, DOCK_H]);
  const mid = (p, q, lift) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + lift];
  return `<g data-part="relay-wires">${k.wireSvg(top, toA, { via: [mid(top, toA, 16)], dashed: true, tone: "lo" })}${k.wireSvg(top, toB, { via: [mid(top, toB, 16)], dashed: true, tone: "lo" })}</g>`;
}

function dock(side) {
  const plan = DOCKS[side];
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), 0, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(plan, 0, DOCK_H, P, 6, 1), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3.5), DOCK_H, P), { tone: "faint" }));
  out.push(D(k.corners(plan, 5).map(([x, y]) => at([x, y, DOCK_H])), { size: 0.45 }));
  // The device lies on the dock: a body, a bezel and a screen with the pairing code and a QR.
  const left = side === "a";
  const phone = left ? { x: plan.x + 8, y: plan.y + 8, w: 44, d: 82, r: 6 } : { x: plan.x + plan.w - 52, y: plan.y + 8, w: 44, d: 82, r: 6 };
  out.push(S(k.slabOf(phone, DOCK_H, 4, P, 8, 0.8), { tone: "mid" }));
  const screen = k.insetPlan(phone, 3);
  out.push(`<g data-part="screen-${side}">${S(k.slabOf(screen, DOCK_H + 4, 0.4, P, 6), { tone: "hi", crease: "none", lit: true })}</g>`);
  const sz = DOCK_H + 4.4;
  out.push(k.faceTextSvg(k.topMatrix([screen.x + screen.w / 2, screen.y + 22], sz, P, "x"), "K7QM", { size: 9, tone: "hi", anchor: "middle" }));
  out.push(`<g data-part="qr-${side}">${D(k.dotGrid(screen.x + 9, screen.y + 34, 7, 7, 3.4, sz, P).filter((_, i) => (i * 7 + (i % 5) * 3) % 4 !== 1), { size: 0.7, tone: "hi" })}</g>`);
  out.push(L(k.lineOnTop([screen.x + 8, screen.y + 66], [screen.x + screen.w - 8, screen.y + 66], sz, P), { tone: "lo", free: "both" }));
  out.push(L(k.lineOnTop([screen.x + 12, screen.y + 70], [screen.x + screen.w - 12, screen.y + 70], sz, P), { tone: "faint", free: "both" }));
  // Safety-phrase lamps: three words, one lamp each, the same on both docks.
  const lampX = left ? plan.x + plan.w - 16 : plan.x + 16;
  for (let i = 0; i < 3; i++) {
    const ly = plan.y + 14 + i * 11;
    out.push(S(k.cylinder(lampX, ly, 4, DOCK_H, 1.4, P, 24, 0.3), { tone: "mid" }));
    out.push(`<path class="p2pa-lamp" data-part="lamp-${side}" d="${k.ring(lampX, ly, 2.8, DOCK_H + 1.4, P, 24)}"/>`);
  }
  // Cartridge tray: settings, rules and notes, each in its own pocket.
  const trayX = left ? plan.x + plan.w - 34 : plan.x + 8;
  const tray = { x: trayX, y: plan.y + 50, w: 26, d: 40, r: 2 };
  out.push(S(k.slabOf(tray, DOCK_H, 2, P, 4, 0.4), { tone: "mid" }));
  for (let i = 0; i < 3; i++) {
    const pocket = { x: tray.x + 3, y: tray.y + 3 + i * 12.4, w: 20, d: 9.4, r: 1.2 };
    out.push(L(k.planOutline(pocket, DOCK_H + 2, P, 3), { tone: "lo" }));
  }
  return { out: out.join(""), tray };
}

function cartridges(side, tray) {
  return [0, 1, 2].map((i) => {
    const plan = { x: tray.x + 4, y: tray.y + 4 + i * 12.4, w: 18, d: 7.4, r: 1.4 };
    const z = DOCK_H + 2;
    const body = S(k.slabOf(plan, z, 6, P, 4, 0.5), { tone: "hi", crease: "lo" });
    const grip = L(k.lineOnTop([plan.x + 3, plan.y + plan.d / 2], [plan.x + plan.w - 3, plan.y + plan.d / 2], z + 6, P), { tone: "faint", free: "both" });
    const pip = D([at([plan.x + plan.w - 2.6, plan.y + 2.4, z + 6])], { size: 0.55, tone: "mid" });
    return `<g class="p2pa-cart" data-part="cart-${side}" data-index="${i}">${body}${grip}${pip}</g>`;
  }).join("");
}

// The rail: a shallow U-channel on two stands, its back lip, then the capsule, then the front lip.
function railBack() {
  const out = [];
  for (const x of [-48, 48]) {
    out.push(S(k.slabOf({ x: x - 5, y: RAIL.y - 2, w: 10, d: RAIL.d + 4, r: 1.5 }, 0, RAIL.z - 2, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x, RAIL.y + RAIL.d + 1, 4])], { size: 0.45 }));
  }
  out.push(S(k.slabOf({ x: RAIL.from, y: RAIL.y, w: RAIL.to - RAIL.from, d: RAIL.d, r: 1 }, RAIL.z - 2, 2, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: RAIL.from, y: RAIL.y, w: RAIL.to - RAIL.from, d: 2.4, r: 0.6 }, RAIL.z, 4, P, 3, 0.3), { tone: "mid" }));
  const ticks = k.topTicks(RAIL.from + 6, RAIL.to - 6, 6, 5, RAIL.y + 0.2, RAIL.z + 4, [1, 2], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  // Collars where the rail meets each dock.
  for (const x of [RAIL.from - 2, RAIL.to - 6]) {
    out.push(S(k.slabOf({ x, y: RAIL.y - 2, w: 8, d: RAIL.d + 4, r: 1.6 }, RAIL.z - 3, 9, P, 4, 0.5), { tone: "mid" }));
  }
  return out.join("");
}

function railFront() {
  const out = [];
  out.push(S(k.slabOf({ x: RAIL.from + 6, y: RAIL.y + RAIL.d - 2.4, w: RAIL.to - RAIL.from - 12, d: 2.4, r: 0.6 }, RAIL.z, 4, P, 3, 0.3), { tone: "mid" }));
  out.push(D([RAIL.from + 14, 0, RAIL.to - 14].map((x) => at([x, RAIL.y + RAIL.d - 1.2, RAIL.z + 4])), { size: 0.4 }));
  return out.join("");
}

// The capsule is built at x = 0 and moved along the rail by the live component.
function capsule() {
  const z = RAIL.z;
  const plan = { x: -CAPSULE_W / 2, y: RAIL.y + 3, w: CAPSULE_W, d: RAIL.d - 6, r: 4.6 };
  const out = [];
  out.push(S(k.slabOf(plan, z, 8, P, 10, 1), { tone: "hi", crease: "lo", lit: true }));
  out.push(L(k.planOutline(k.insetPlan(plan, 2.2), z + 8, P, 8), { tone: "lo" }));
  // Padlock: a body and a shackle standing on the capsule.
  const cy = plan.y + plan.d / 2;
  const lock = { x: -3.4, y: cy - 2.4, w: 6.8, d: 4.8, r: 1 };
  out.push(S(k.slabOf(lock, z + 8, 5, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  const shackle = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * (i / 12);
    shackle.push(at([-2.2 * Math.cos(a), cy, z + 13 + 3 * Math.sin(a)]));
  }
  out.push(`<path class="iso-line" data-tone="hi" d="${k.pathOf(shackle)}" style="stroke-width:1.1"/>`);
  out.push(D([at([0, cy + 2.4, z + 10.5])], { size: 0.5, tone: "lo" }));
  return `<g data-part="capsule">${out.join("")}</g>`;
}

const dockA = dock("a");
const dockB = dock("b");

const body = [
  base(),
  mast(),
  mastWires(),
  dockA.out,
  cartridges("a", dockA.tray),
  railBack(),
  capsule(),
  railFront(),
  dockB.out,
  cartridges("b", dockB.tray),
];

const label =
  "An isometric drawing of two device docks on one bench, joined by a sealed rail. Each dock shows the same pairing code and three safety-phrase lamps. The sender's tray holds three cartridges for settings, rules and notes. A locked capsule rides the rail directly from one dock to the other. A small relay mast behind the rail is wired to both docks to help them find each other; it has an empty tray and the capsule never stops there.";

const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label, body, className: "p2pa-svg" });

// Screen-space vectors the live component needs: one world unit along x (capsule travel)
// and one unit up (cartridge lift).
const geometry = {
  travel: TRAVEL,
  start: TRAVEL[0],
  unitX: screenVec([1, 0, 0]),
  unitZ: screenVec([0, 0, 1]),
};

const module = `// Generated by tools/p2p-anatomy/build.mjs with the Anatomy kit. Do not edit by hand.
export const p2pAnatomySvg = ${JSON.stringify(svg)};
export const p2pAnatomyGeometry = ${JSON.stringify(geometry)};
`;
writeFileSync(join(ROOT, "components", "p2p-anatomy-art.js"), module);
console.log(`wrote components/p2p-anatomy-art.js (${(svg.length / 1024).toFixed(1)} KB of SVG)`);

if (process.argv.includes("--page")) {
  const css = k.ISO_CSS;
  mkdirSync(join(HERE, "out"), { recursive: true });
  writeFileSync(join(HERE, "out", "preview.html"), `<!doctype html><meta charset="utf-8"><style>${css} body{margin:0;background:#f6f2eb} .wrap{width:1100px;margin:20px auto} [data-part="capsule"]{transform:translate(${geometry.unitX[0] * TRAVEL[0]}px,${geometry.unitX[1] * TRAVEL[0]}px)}</style><div class="iso wrap" data-theme="light">${svg}</div>`);
  console.log("wrote tools/p2p-anatomy/out/preview.html");
}
