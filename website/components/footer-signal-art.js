"use client";

import { useEffect, useRef } from "react";

// Premium soft-pastel color palettes calibrated to match the 
// homepage hero section's serene flower-covered hills
const palettes = {
  dawn: {
    skyTop: "#0f1326",        // Deep dark night-violet
    skyBottom: "#3c325c",     // Soft warm purple
    horizon: "#d47a6b",       // Peach dawn glow
    horizonGlow: "#f5caa6",   // Golden morning light
    sunMoon: "#fff0db",       // Creamy crescent moon
    stars: "#edd5c8",         // Soft warm stars
    mtnFar: "#1d2038",        // Silhouette mountains
    hillMid: "#182334",       // Soft dark-teal midground hills
    hillFore: "#0d1826",      // Deeper forest teal foreground
    foliage: "#182a33",       // Deep teal tree foliage
    trunk: "#221319",         // Dark bark
    flowerPink: "#e8a7bc",    // Soft dawn pink flowers
    flowerYellow: "#f5d19e",  // Soft yellow flowers
    flowerWhite: "#eef7ff",   // Crisp white/blue flowers
    blockedPacket: "#d45a4a",  // Blocked soft red
    signalRail: "#41a1cf",    // Clean blue firefly
    dust: "#d45a4a",
    desk: "#120e18",
    laptop: "#0a0a0f",
    screen: "#41a1cf",
    ground: "#060914",        // Base dark ground
  },
  day: {
    skyTop: "#3ca1cf",        // Hero crisp blue
    skyBottom: "#79c2dc",     // Soft daylight blue
    horizon: "#e2f2f7",       // Pale cream horizon
    horizonGlow: "#fffded",   // Day sun glow
    sunMoon: "#ffeed0",       // Soft radiant sun
    stars: "transparent",     // No stars in daytime
    mtnFar: "#306e8b",        // Distant blue mountain ridge
    hillMid: "#255a40",       // Lush soft green valley
    hillFore: "#15422b",      // Foreground green grass
    foliage: "#103c28",       // Sprawling oak leaves
    trunk: "#2b1b15",
    flowerPink: "#f5b7c7",    // Vibrant pink petals
    flowerYellow: "#ffeb9c",  // Sunshine yellow petals
    flowerWhite: "#ffffff",   // Crisp white petals
    blockedPacket: "#ab4438",
    signalRail: "#41a1cf",
    dust: "#cf5e50",
    desk: "#1c262c",
    laptop: "#0a0a0f",
    screen: "#41a1cf",
    ground: "#0b2618",        // Forest ground base
  },
  sunset: {
    skyTop: "#2a1638",        // Evening dark violet
    skyBottom: "#702652",     // Magenta sunset sky
    horizon: "#a93e31",       // Rich warm red horizon
    horizonGlow: "#f59a58",   // Fiery golden glow
    sunMoon: "#ffd494",       // Soft setting sun
    stars: "#fadbc8",         // Sunset stars
    mtnFar: "#381c3c",        // Sunset violet ridge
    hillMid: "#221124",       // Soft dark-burgundy hills
    hillFore: "#160517",      // Deep sunset foreground shadow
    foliage: "#200a1c",       // Sunset oak tree canopy
    trunk: "#1b0509",
    flowerPink: "#e88da4",    // Soft rose petals
    flowerYellow: "#f5be7a",  // Amber yellow petals
    flowerWhite: "#fadad2",   // Soft peach petals
    blockedPacket: "#e85d44",
    signalRail: "#41a1cf",
    dust: "#e06e5a",
    desk: "#150415",
    laptop: "#060108",
    screen: "#41a1cf",
    ground: "#09010c",
  },
  night: {
    skyTop: "#04060b",        // Silent night void
    skyBottom: "#0b101c",     // Midnight sky blue
    horizon: "#121b2a",       // Muted sky horizon
    horizonGlow: "#203046",   // Silver moon halo
    sunMoon: "#e8f2ff",       // Bright silver crescent moon
    stars: "#cbe3ff",         // Twinkling cold blue stars
    mtnFar: "#060a12",        // Distant dark ridge
    hillMid: "#03060c",       // Shadowy blue-black hills
    hillFore: "#010205",      // Deepest foreground grass
    foliage: "#02070e",       // Midnight tree leaves
    trunk: "#08080c",
    flowerPink: "#b07b8b",    // Bioluminescent soft pink
    flowerYellow: "#b5a378",  // Bioluminescent soft yellow
    flowerWhite: "#a8bdcc",   // Bioluminescent silver white
    blockedPacket: "#c45040",
    signalRail: "#41a1cf",
    dust: "#ab4438",
    desk: "#06080c",
    laptop: "#020204",
    screen: "#41a1cf",
    ground: "#000102",
  },
};

// Seeded PRNG for highly responsive and stable procedural generation
function seedRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Helper to draw a pixel rectangle on our cell-based retro grid
function drawPixelRect(ctx, cx, cy, cw, ch, color, cell) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(cx * cell),
    Math.round(cy * cell),
    Math.round(cw * cell),
    Math.round(ch * cell)
  );
}

// 2x2 Ordered Dithering Matrix for smooth retro gradients
const DITHER_MATRIX = [
  [0.25, 0.75],
  [0.75, 0.50]
];

function hexToRgb(hex) {
  const cleaned = hex.replace("#", "");
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

// Blends two colors and returns standard RGB/RGBA format
function interpolateColor(c1, c2, t, alpha = 1.0) {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
  if (alpha === 1.0) {
    return `rgb(${r},${g},${b})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── 1. DITHERED GRADIENT SKY ──────────────────────────────────────────
function drawDitheredSky(ctx, w, h, skyEnd, pal) {
  for (let y = 0; y < skyEnd; y++) {
    const t = y / skyEnd;
    let colorA, colorB, u;

    if (t < 0.45) {
      colorA = pal.skyTop;
      colorB = pal.skyBottom;
      u = t / 0.45;
    } else {
      colorA = pal.skyBottom;
      colorB = pal.horizon;
      u = (t - 0.45) / 0.55;
    }

    // Process row cells individually to apply dither checkerboard
    for (let x = 0; x < w; x++) {
      const threshold = DITHER_MATRIX[y % 2][x % 2];
      const color = u > threshold ? colorB : colorA;
      drawPixelRect(ctx, x, y, 1, 1, color, 1); // 1-to-1 inside scaled context
    }
  }
}

// ── 2. CELESTIAL SUN/MOON ─────────────────────────────────────────────
function drawCelestial(ctx, w, h, pal, scene, time, reducedMotion) {
  const cx = Math.round(w * 0.18);
  const cy = Math.round(h * 0.22);
  const pulse = reducedMotion ? 0.3 : (Math.sin(time * 0.001) + 1) * 0.5;

  if (scene === "day" || scene === "sunset") {
    // RENDER PROCEDURAL SUN (Daytime)
    const r = 6;
    // Glowing halos
    drawPixelRect(ctx, cx - r - 6, cy - r - 6, (r + 6) * 2, (r + 6) * 2, `rgba(255,245,210,${0.03 + pulse * 0.02})`, 1);
    drawPixelRect(ctx, cx - r - 3, cy - r - 3, (r + 3) * 2, (r + 3) * 2, `rgba(255,245,210,${0.07 + pulse * 0.04})`, 1);
    
    // Core Sun Circle
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (dx * dx + dy * dy <= r * r) {
          drawPixelRect(ctx, cx + dx, cy + dy, 1, 1, pal.sunMoon, 1);
        }
      }
    }
  } else {
    // RENDER CRESCENT MOON (Dawn/Night)
    const r = 7;
    // Soft crescent glow
    drawPixelRect(ctx, cx - r - 4, cy - r - 4, (r + 4) * 2, (r + 4) * 2, `rgba(235,245,255,${0.02 + pulse * 0.015})`, 1);

    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const distCenter = dx * dx + dy * dy;
        const distOffset = (dx - 2.8) * (dx - 2.8) + (dy - 0.6) * (dy - 0.6);
        if (distCenter < r * r && distOffset > (r - 3) * (r - 3)) {
          drawPixelRect(ctx, cx + dx, cy + dy, 1, 1, pal.sunMoon, 1);
        }
      }
    }
  }
}

// ── 3. STARS ──────────────────────────────────────────────────────────
function drawStars(ctx, w, h, skyEnd, pal, time) {
  if (pal.stars === "transparent") return;

  const cols = Math.floor(w / 14);
  const rows = Math.floor(skyEnd / 8);

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cellSeed = c * 93.7 + r * 143.1;
      const randVal = seedRandom(cellSeed);
      if (randVal < 0.94) continue; // Sparse placement

      const x = Math.round(c * 14 + seedRandom(cellSeed + 1.2) * 10);
      const y = Math.round(r * 8 + seedRandom(cellSeed + 2.5) * 6);
      
      const blink = (Math.sin(time * 0.0018 + cellSeed) + 1) * 0.5;
      if (blink < 0.12) continue;

      const isCross = randVal > 0.985;
      const opacity = blink * (0.35 + seedRandom(cellSeed + 4.1) * 0.4);

      if (isCross) {
        // Bright retro star cross
        drawPixelRect(ctx, x, y, 1, 1, `rgba(255,255,255,${opacity})`, 1);
        drawPixelRect(ctx, x - 1, y, 1, 1, `rgba(255,255,255,${opacity * 0.45})`, 1);
        drawPixelRect(ctx, x + 1, y, 1, 1, `rgba(255,255,255,${opacity * 0.45})`, 1);
        drawPixelRect(ctx, x, y - 1, 1, 1, `rgba(255,255,255,${opacity * 0.45})`, 1);
        drawPixelRect(ctx, x, y + 1, 1, 1, `rgba(255,255,255,${opacity * 0.45})`, 1);
      } else {
        // Single pixel star
        drawPixelRect(ctx, x, y, 1, 1, `rgba(255,255,255,${opacity * 0.85})`, 1);
      }
    }
  }
}

// Cloud structures defined via retro 8-bit shapes
const CLOUD_SHAPES = [
  [
    [2,0], [3,0], [4,0],
    [1,1], [2,1], [3,1], [4,1], [5,1], [6,1],
    [0,2], [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2],
    [1,3], [2,3], [3,3], [4,3], [5,3]
  ],
  [
    [3,0], [4,0], [5,0], [6,0],
    [2,1], [3,1], [4,1], [5,1], [6,1], [7,1],
    [0,2], [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2],
    [2,3], [3,3], [4,3], [5,3], [6,3], [7,3]
  ]
];

// ── 4. DRIFTING PARALLAX CLOUDS ───────────────────────────────────────
function drawClouds(ctx, w, h, pal, time) {
  const count = 3;
  const cloudColors = [
    "rgba(255, 255, 255, 0.16)",
    "rgba(255, 255, 255, 0.08)",
    "rgba(255, 255, 255, 0.12)",
  ];

  for (let i = 0; i < count; i++) {
    const seed = i * 231.7;
    const speed = 0.005 + seedRandom(seed + 1.2) * 0.006;
    const scrollY = Math.round(5 + seedRandom(seed + 2.1) * 16);
    const shapeIdx = i % CLOUD_SHAPES.length;
    const shape = CLOUD_SHAPES[shapeIdx];

    // Scroll cloud position horizontally with wrap-around
    const width = 12;
    const scrollX = Math.round((time * speed + seedRandom(seed) * w * 2) % (w + width * 2)) - width;

    // Draw the cloud
    for (const cell of shape) {
      const cx = scrollX + cell[0];
      const cy = scrollY + cell[1];
      if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
        const isShadow = cell[1] === 3; // Shading on the bottom cloud rows
        const color = isShadow ? "rgba(0, 0, 0, 0.05)" : cloudColors[i];
        drawPixelRect(ctx, cx, cy, 1, 1, color, 1);
      }
    }
  }
}

// ── 5. DISTANT HILLS (PARALLAX LAYER 1) ───────────────────────────────
function drawFarHills(ctx, w, h, pal) {
  const base = Math.round(h * 0.44);

  for (let x = 0; x < w; x++) {
    const hillHeight = Math.round(
      Math.sin(x * 0.035) * 8 +
      Math.cos(x * 0.08) * 3 +
      base
    );

    const y0 = Math.max(0, hillHeight);
    const y1 = h;
    
    // Draw hill body
    drawPixelRect(ctx, x, y0, 1, y1 - y0, pal.mtnFar, 1);

    // Subtle peak highlights to look 3D and soft
    const prevHeight = Math.round(Math.sin((x - 1) * 0.035) * 8 + Math.cos((x - 1) * 0.08) * 3 + base);
    if (y0 < prevHeight) {
      drawPixelRect(ctx, x, y0, 1, 1, interpolateColor(pal.mtnFar, pal.horizonGlow, 0.16), 1);
    }
  }
}

// ── 6. MIDGROUND VALLEYS (PARALLAX LAYER 2) ───────────────────────────
function drawMidgroundValleys(ctx, w, h, pal) {
  const base = Math.round(h * 0.58);

  for (let x = 0; x < w; x++) {
    const hillHeight = Math.round(
      Math.sin(x * 0.07) * 5 +
      Math.cos(x * 0.15) * 2 +
      base
    );

    const y0 = Math.max(0, hillHeight);
    const y1 = h;
    
    // Draw valley body
    drawPixelRect(ctx, x, y0, 1, y1 - y0, pal.hillMid, 1);

    // Soft ridge highlight
    const prevHeight = Math.round(Math.sin((x - 1) * 0.07) * 5 + Math.cos((x - 1) * 0.15) * 2 + base);
    if (y0 < prevHeight) {
      drawPixelRect(ctx, x, y0, 1, 1, interpolateColor(pal.hillMid, pal.horizonGlow, 0.12), 1);
    }
  }
}

// ── 7. FOREGROUND GRASS & SWAYING WILDFLOWERS (PARALLAX LAYER 3) ──────
function drawForegroundMeadow(ctx, w, h, pal, time, scene, reducedMotion) {
  const base = Math.round(h * 0.69);

  // 1. Render Foreground Green Slopes
  for (let x = 0; x < w; x++) {
    const hillHeight = Math.round(Math.sin(x * 0.09) * 2 + base);
    drawPixelRect(ctx, x, hillHeight, 1, h - hillHeight, pal.hillFore, 1);
  }

  // 2. Render Swaying Wildflowers (scattered procedurally based on columns)
  for (let x = 0; x < w - 20; x++) { // Keep flowers away from the right-side laptop station
    const seed = x * 147.3;
    const isFlower = seedRandom(seed) > 0.88; // 12% probability of a flower at column x
    if (!isFlower) continue;

    const hillHeight = Math.round(Math.sin(x * 0.09) * 2 + base);
    const stemH = Math.round(2 + seedRandom(seed + 1.2) * 3);
    const flowerY = hillHeight - 1;

    // Stem color (darker green blending with grass)
    const stemColor = interpolateColor(pal.hillFore, "#000000", 0.2);
    
    // Draw stem pixels
    drawPixelRect(ctx, x, flowerY - stemH, 1, stemH, stemColor, 1);

    // Petal color selection matching the pink, yellow, white flowers in the hero section
    const petalChoice = seedRandom(seed + 2.5);
    let petalColor = pal.flowerWhite;
    let glowColor = "rgba(255,255,255,0.06)";

    if (petalChoice < 0.33) {
      petalColor = pal.flowerPink;
      glowColor = "rgba(245,183,199,0.07)";
    } else if (petalChoice < 0.66) {
      petalColor = pal.flowerYellow;
      glowColor = "rgba(255,235,156,0.07)";
    }

    // Breeze sway offset simulation
    const sway = reducedMotion ? 0 : Math.round(Math.sin(time * 0.0022 + x) * 0.65);
    const headX = x + sway;
    const headY = flowerY - stemH;

    // Draw soft bioluminescent glow for Sunset/Night/Dawn
    if (scene !== "day") {
      drawPixelRect(ctx, headX - 1, headY - 1, 3, 3, glowColor, 1);
    }

    // Draw retro pixel-art cross flower head (Center stem color with 4 surrounding petals)
    drawPixelRect(ctx, headX, headY, 1, 1, stemColor, 1);         // Center
    drawPixelRect(ctx, headX - 1, headY, 1, 1, petalColor, 1);     // Left Petal
    drawPixelRect(ctx, headX + 1, headY, 1, 1, petalColor, 1);     // Right Petal
    drawPixelRect(ctx, headX, headY - 1, 1, 1, petalColor, 1);     // Top Petal
    drawPixelRect(ctx, headX, headY + 1, 1, 1, petalColor, 1);     // Bottom Petal
  }
}

// ── 8. COZY FRAME OAK & LAPTOP WORKSPACE (PARALLAX LAYER 4) ───────────
function drawForegroundWorkspace(ctx, w, h, pal, time, screenFlash, reducedMotion) {
  const gY = Math.round(h * 0.77);
  drawPixelRect(ctx, 0, gY, w, h - gY, pal.ground, 1);

  // Workspace coordinates
  const stationX = Math.round(w * 0.75);
  const stationY = gY - 1;

  // Render Cozy Wooden Coding Table
  const deskW = 12;
  const deskH = 3;
  const deskX = stationX - Math.round(deskW / 2);
  const deskY = stationY - deskH;

  // Draw Desk Base & Legs
  drawPixelRect(ctx, deskX, deskY, deskW, 1, pal.desk, 1); // Top Surface
  drawPixelRect(ctx, deskX + 1, deskY + 1, 1, 2, pal.desk, 1); // Left Leg
  drawPixelRect(ctx, deskX + deskW - 2, deskY + 1, 1, 2, pal.desk, 1); // Right Leg

  // Cozy Desk Lamp Setup
  const lampX = deskX + 1;
  const lampY = deskY - 3;
  drawPixelRect(ctx, lampX, lampY + 1, 1, 2, pal.desk, 1); // Support Post
  drawPixelRect(ctx, lampX, lampY, 1, 1, pal.flowerYellow, 1); // Glowing Bulb
  
  // Lamp Glow (Soft Halo)
  const lampPulse = reducedMotion ? 0.3 : (Math.sin(time * 0.002) + 1) * 0.5;
  drawPixelRect(ctx, lampX - 2, lampY - 1, 5, 4, `rgba(255,249,196,${0.045 + lampPulse * 0.02})`, 1);

  // Render 8-Bit Cozy Laptop
  const laptopX = stationX - 2;
  const laptopY = deskY - 1;
  
  // Keyboard Base
  drawPixelRect(ctx, laptopX - 1, laptopY + 1, 6, 1, pal.laptop, 1);
  
  // Screen Casing
  drawPixelRect(ctx, laptopX, laptopY - 3, 4, 4, pal.laptop, 1);
  
  // Active Screen Glow
  let screenColor = pal.screen;
  if (screenFlash > 0) {
    // Screen flashes bright white/blue when a packet is processed
    screenColor = interpolateColor(pal.screen, "#ffffff", Math.min(1, screenFlash));
  }
  drawPixelRect(ctx, laptopX + 1, laptopY - 2, 2, 2, screenColor, 1);

  // Sprawling Old Oak Tree framing the right border
  const treeBaseX = w - 4;
  const treeBaseY = gY;
  
  // Curved Oak Trunk
  drawPixelRect(ctx, treeBaseX, treeBaseY - 14, 2, 14, pal.trunk, 1);
  drawPixelRect(ctx, treeBaseX - 3, treeBaseY - 15, 4, 2, pal.trunk, 1);
  drawPixelRect(ctx, treeBaseX - 7, treeBaseY - 16, 5, 1, pal.trunk, 1);

  // Leafy Canopies overhanging the desk
  const foliageSway = reducedMotion ? 0 : Math.round(Math.sin(time * 0.0012) * 0.8);
  const canopyClumps = [
    { cx: treeBaseX - 10 + foliageSway, cy: treeBaseY - 18, cw: 8, ch: 4 },
    { cx: treeBaseX - 5 + Math.round(foliageSway * 0.7), cy: treeBaseY - 19, cw: 10, ch: 5 },
    { cx: treeBaseX - 1 + Math.round(foliageSway * 0.4), cy: treeBaseY - 20, cw: 6, ch: 4 },
  ];

  for (const clump of canopyClumps) {
    drawPixelRect(ctx, clump.cx, clump.cy, clump.cw, clump.ch, pal.foliage, 1);
    // Add pixelated soft leaf highlights on top boundaries
    drawPixelRect(
      ctx,
      clump.cx + 1,
      clump.cy,
      clump.cw - 2,
      1,
      interpolateColor(pal.foliage, pal.horizonGlow, 0.16),
      1
    );
  }
}

// ── 9. DANDELION SEEDS & FIREFLY SIGNALS (THE PROGRAMMING ART) ────────
function updateAndDrawSignals(ctx, w, h, pal, time, particles, state, screenFlashRef, reducedMotion) {
  const gY = Math.round(h * 0.77);
  const stationX = Math.round(w * 0.75);
  const laptopY = gY - 4;
  const gateX = stationX - 16;

  // Dotted wind lane heights
  const lanes = [
    Math.round(h * 0.48),
    Math.round(h * 0.58),
    Math.round(h * 0.68)
  ];

  // Draw shimmering lane wind guidelines (low opacity)
  ctx.strokeStyle = `rgba(${hexToRgb(pal.horizon).join(",")},0.035)`;
  ctx.lineWidth = 0.5;
  for (const laneY of lanes) {
    ctx.beginPath();
    ctx.setLineDash([2, 5]);
    ctx.moveTo(0, laneY);
    ctx.lineTo(gateX, laneY);
    ctx.stroke();
  }
  ctx.setLineDash([]); // Reset dash

  // Cozy Shimmering Breeze Barrier (Filter Gate)
  const gatePulse = reducedMotion ? 0.3 : (Math.sin(time * 0.005) + 1.2) * 0.5;
  const gateColor = `rgba(${hexToRgb(pal.signalRail).join(",")},${0.14 + gatePulse * 0.1})`;
  drawPixelRect(ctx, gateX, lanes[0] - 4, 1, lanes[2] - lanes[0] + 8, gateColor, 1);
  drawPixelRect(ctx, gateX - 1, lanes[0] - 2, 3, lanes[2] - lanes[0] + 4, `rgba(${hexToRgb(pal.signalRail).join(",")},${0.04 + gatePulse * 0.04})`, 1);

  // Periodic Spawning of floating noise particles
  if (state.lastSpawn === 0) state.lastSpawn = time;
  const spawnInterval = reducedMotion ? 2500 : 700;
  if (time - state.lastSpawn > spawnInterval && particles.filter(p => p.type === "noise").length < 6) {
    const randLane = Math.floor(Math.random() * lanes.length);
    particles.push({
      x: 0,
      baseY: lanes[randLane],
      vx: 0.6 + Math.random() * 0.35,
      type: "noise",
      // Blocked noise packets are soft red/orange; safe metadata is light gray
      color: Math.random() > 0.6 ? pal.blockedPacket : "rgba(130,138,145,0.48)",
      size: 1.2,
      phase: Math.random() * Math.PI * 2,
    });
    state.lastSpawn = time;
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    if (p.type === "noise") {
      // Noise floats in an organic, wavy path horizontally
      p.x += p.vx;
      p.y = p.baseY + Math.sin(p.x * 0.05 + time * 0.0028 + p.phase) * 3;

      if (p.x >= gateX) {
        // Collided with Shimmering Gate!
        particles.splice(i, 1); // Remove noise
        
        // 70% Blocked, 30% Filtered
        const isBlocked = Math.random() > 0.32;
        if (isBlocked) {
          // Blocked: floats upwards like glowing pollen and dissolves into the sky
          const pollenCount = 3 + Math.floor(Math.random() * 3);
          for (let d = 0; d < pollenCount; d++) {
            particles.push({
              x: gateX,
              y: p.y,
              vx: (Math.random() - 0.5) * 0.4,
              vy: -0.5 - Math.random() * 0.6, // Ascend
              type: "dust",
              color: pal.dust,
              size: 0.8,
              alpha: 1.0,
              life: 30 + Math.floor(Math.random() * 25),
            });
          }
        } else {
          // Filtered: turns into a blue firefly and floats down to laptop screen
          particles.push({
            x: gateX,
            y: p.y,
            vx: 0.45,
            vy: -1.0,
            targetX: stationX,
            targetY: laptopY,
            type: "filtered",
            color: pal.signalRail,
            size: 1.0,
          });
        }
      }
    } else if (p.type === "dust") {
      // Pollen dust ascends slowly and fades out in the wind
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.98; // Drag
      p.life--;
      p.alpha = p.life / 50;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    } else if (p.type === "filtered") {
      // Float gracefully down towards coding desk laptop
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.8) {
        // Hit screen!
        particles.splice(i, 1);
        screenFlashRef.current = 1.0; // Trigger laptop glow flash

        // Spawn a structured, calm blue firefly drifting off to the right
        particles.push({
          x: p.targetX + 3,
          y: gY + 1.5,
          vx: 0.3,
          type: "calm",
          color: pal.signalRail,
          size: 1.0,
          phase: Math.random() * Math.PI * 2,
        });
      } else {
        // Curved drift towards screen
        p.x += (dx / dist) * 0.75;
        p.y += (dy / dist) * 0.75;
      }
    } else if (p.type === "calm") {
      // Moves in a perfectly flat horizontal ordered list off screen to the right
      p.x += p.vx;
      // Slight vertical float over grass
      p.y = gY + 1.5 + Math.sin(p.x * 0.08 + p.phase) * 0.6;
      if (p.x >= w) {
        particles.splice(i, 1);
      }
    }
  }

  // Draw Particles
  for (const p of particles) {
    let color = p.color;
    if (p.type === "dust") {
      color = `rgba(${hexToRgb(p.color).join(",")},${p.alpha})`;
    }
    
    // Draw firefly/pollen glow
    if (p.type === "filtered" || p.type === "calm") {
      drawPixelRect(ctx, p.x - 1, p.y - 1, 3, 3, "rgba(65,161,207,0.06)", 1);
    }
    drawPixelRect(ctx, p.x, p.y, p.size, p.size, color, 1);
  }
}

// ── COMPOSITOR ────────────────────────────────────────────────────────
function drawFooterArt(canvas, time, state, screenFlashRef, reducedMotion) {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  // Calibrated resolution scaling to keep sharp retro game look (cell size: 3.5px)
  const cell = 3.5;
  const width = Math.max(100, Math.round(bounds.width / cell));
  const height = Math.max(50, Math.round(bounds.height / cell));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;

  const scene = document.documentElement.dataset.scene || "day";
  const pal = palettes[scene] || palettes.day;
  const skyEnd = Math.round(height * 0.62);

  // Interpolate screen flash duration
  if (screenFlashRef.current > 0) {
    screenFlashRef.current -= 0.06;
    if (screenFlashRef.current < 0) screenFlashRef.current = 0;
  }

  // Draw Meadow Layers
  drawDitheredSky(ctx, width, height, skyEnd, pal);
  drawCelestial(ctx, width, height, pal, scene, time, reducedMotion);
  drawStars(ctx, width, height, skyEnd, pal, time);
  drawClouds(ctx, width, height, pal, time);
  drawFarHills(ctx, width, height, pal);
  drawMidgroundValleys(ctx, width, height, pal);
  drawForegroundMeadow(ctx, width, height, pal, time, scene, reducedMotion);
  drawForegroundWorkspace(ctx, width, height, pal, time, screenFlashRef.current, reducedMotion);
  updateAndDrawSignals(ctx, width, height, pal, time, state.particles, state, screenFlashRef, reducedMotion);
}

// ── COMPONENT WRAPPER ─────────────────────────────────────────────────
export function FooterSignalArt() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const screenFlashRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let active = false;
    let reducedMotion = reducedMotionQuery.matches;
    let lastFrame = 0;

    // Component scoped states that persist across frames
    const state = {
      particles: [],
      lastSpawn: 0,
    };

    const render = (time = performance.now()) => {
      drawFooterArt(canvas, time, state, screenFlashRef, reducedMotion);
    };

    const tick = (time) => {
      if (!active) return;
      if (time - lastFrame > 42) { // 24fps target for authentic retro feel and ultra low CPU/GPU load
        render(time);
        lastFrame = time;
      }
      if (!reducedMotion) frameId = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (active) return;
      active = true;
      frameId = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      active = false;
      window.cancelAnimationFrame(frameId);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          render();
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "120px" }
    );

    const ro = new ResizeObserver(() => render());

    const mo = new MutationObserver(() => render());

    const handleMotion = (e) => {
      reducedMotion = e.matches;
      render();
      if (!reducedMotion) start();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        render();
        start();
      } else {
        stop();
      }
    };

    render();
    io.observe(wrapper);
    ro.observe(wrapper);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-scene", "data-theme"]
    });
    reducedMotionQuery.addEventListener("change", handleMotion);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      reducedMotionQuery.removeEventListener("change", handleMotion);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="relative h-[20rem] overflow-hidden bg-[#04060b] md:h-[24rem] lg:h-[27rem]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
      />
      {/* Dynamic gradient overlay to fade content in nicely from bottom and top borders */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,11,0.1),transparent_24%,rgba(1,2,4,0.38)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(4,6,11,0.14),transparent)]" />
    </div>
  );
}
