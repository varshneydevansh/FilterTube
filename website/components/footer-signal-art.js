"use client";

import { useEffect, useRef } from "react";

const CELL_DESKTOP = 4;
const CELL_MOBILE = 3;

const palettes = {
  dawn: {
    skyTop: "#7fc7ee",
    skyMid: "#bde7f3",
    skyBottom: "#f5d5bd",
    cloud: "#e7fbff",
    cloudShade: "#9fd6e8",
    sun: "#fff1bf",
    city: "#77a2bc",
    cityShade: "#4f7d9a",
    hillBack: "#75a981",
    hillFront: "#44755b",
    grass: "#78b55e",
    grassShade: "#2e5a42",
    trunk: "#654b38",
    leaf: "#477a54",
    leafLight: "#78aa61",
    device: "#263341",
    deviceShade: "#121a24",
    screen: "#55b5df",
    accent: "#cf5f4f",
    glow: "#fff2cf",
  },
  day: {
    skyTop: "#2299dc",
    skyMid: "#66c3ee",
    skyBottom: "#c9eff7",
    cloud: "#dffaff",
    cloudShade: "#92d8ef",
    sun: "#fff1b5",
    city: "#8cb3c4",
    cityShade: "#5f8fa9",
    hillBack: "#80b77b",
    hillFront: "#4e895f",
    grass: "#83bf50",
    grassShade: "#2d633d",
    trunk: "#684d35",
    leaf: "#3e744d",
    leafLight: "#80b857",
    device: "#253241",
    deviceShade: "#111923",
    screen: "#3aa6d7",
    accent: "#bd4c3e",
    glow: "#fff4c8",
  },
  sunset: {
    skyTop: "#6c70b8",
    skyMid: "#df8f8a",
    skyBottom: "#ffd3aa",
    cloud: "#ffe2ce",
    cloudShade: "#d58684",
    sun: "#ffd19b",
    city: "#9b7890",
    cityShade: "#70546f",
    hillBack: "#8d8a5b",
    hillFront: "#5c6b43",
    grass: "#7f9747",
    grassShade: "#374434",
    trunk: "#604436",
    leaf: "#4e6642",
    leafLight: "#8fa854",
    device: "#2b2735",
    deviceShade: "#151321",
    screen: "#6fa7cf",
    accent: "#d56e58",
    glow: "#ffd8ad",
  },
  night: {
    skyTop: "#10213a",
    skyMid: "#294d75",
    skyBottom: "#6d93b8",
    cloud: "#8fb6d1",
    cloudShade: "#426785",
    sun: "#e8f4ff",
    city: "#496b83",
    cityShade: "#233b54",
    hillBack: "#426a5d",
    hillFront: "#264b3f",
    grass: "#3f7255",
    grassShade: "#132a24",
    trunk: "#43372c",
    leaf: "#264f39",
    leafLight: "#4f8158",
    device: "#182332",
    deviceShade: "#07101b",
    screen: "#245d8c",
    accent: "#b85648",
    glow: "#dcecff",
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgba(hex, alpha) {
  const color = hexToRgb(hex);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function mixHex(start, end, amount) {
  const a = hexToRgb(start);
  const b = hexToRgb(end);
  const t = clamp(amount, 0, 1);
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(
    a.g + (b.g - a.g) * t,
  )}, ${Math.round(a.b + (b.b - a.b) * t)})`;
}

function hash2(x, y, seed) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 41.9) * 43758.5453;
  return value - Math.floor(value);
}

function getSceneName() {
  return document.documentElement.dataset.scene || "day";
}

function getThemeName() {
  return document.documentElement.dataset.theme || "light";
}

function getDailySeed() {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - dayStart) / 86400000) + now.getFullYear() * 1000;
}

function getDayPhase() {
  const now = new Date();
  return (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawBlockCircle(ctx, x, y, radius, cell, color) {
  for (let yy = -radius; yy <= radius; yy += cell) {
    for (let xx = -radius; xx <= radius; xx += cell) {
      if (xx * xx + yy * yy <= radius * radius) {
        px(ctx, x + xx, y + yy, cell, cell, color);
      }
    }
  }
}

function drawSky(ctx, width, height, cell, palette) {
  const horizon = height * 0.7;

  for (let y = 0; y < horizon; y += cell) {
    const t = y / horizon;
    const color =
      t < 0.52
        ? mixHex(palette.skyTop, palette.skyMid, t / 0.52)
        : mixHex(palette.skyMid, palette.skyBottom, (t - 0.52) / 0.48);
    px(ctx, 0, y, width, cell, color);
  }
}

function drawCloud(ctx, x, y, cell, palette, scale, drift, alpha) {
  const unit = cell * scale;
  const offset = Math.round(Math.sin(drift) * cell * 2);
  const pieces = [
    [0, 4, 6, 2, palette.cloudShade],
    [4, 2, 7, 4, palette.cloud],
    [9, 0, 8, 5, palette.cloud],
    [15, 3, 7, 3, palette.cloud],
    [21, 5, 5, 2, palette.cloudShade],
    [3, 7, 16, 2, palette.cloud],
  ];

  ctx.globalAlpha = alpha;
  for (const [cx, cy, w, h, color] of pieces) {
    px(ctx, x + offset + cx * unit, y + cy * unit, w * unit, h * unit, color);
  }
  ctx.globalAlpha = 1;
}

function drawCity(ctx, width, height, cell, palette, seed) {
  const baseY = Math.round(height * 0.66 / cell) * cell;

  for (let x = -cell; x < width + cell * 2; x += cell * 2) {
    const column = Math.floor(x / cell);
    const noise = hash2(column, 4, seed);
    const towerWidth = (1 + Math.floor(hash2(column, 8, seed) * 3)) * cell;
    const towerHeight = (2 + Math.floor(noise * 7)) * cell;
    const color = noise > 0.62 ? palette.city : palette.cityShade;
    px(ctx, x, baseY - towerHeight, towerWidth, towerHeight, rgba(color, 0.7));

    if (noise > 0.5) {
      for (let y = baseY - towerHeight + cell; y < baseY - cell; y += cell * 2) {
        if (hash2(column, y / cell, seed) > 0.64) {
          px(ctx, x + cell * 0.45, y, cell * 0.65, cell * 0.65, rgba(palette.glow, 0.42));
        }
      }
    }
  }
}

function drawRidge(ctx, width, height, cell, seed, color, base, amp, step, phase) {
  for (let x = -cell; x < width + cell; x += cell) {
    const column = Math.floor(x / cell);
    const ridge =
      base +
      Math.sin(column * step + seed * 0.01 + phase) * amp +
      Math.sin(column * step * 2.1 + seed * 0.02) * amp * 0.38;
    const y = Math.round((height * ridge) / cell) * cell;
    px(ctx, x, y, cell, height - y, color);
  }
}

function drawTree(ctx, x, groundY, cell, palette, scale, sway) {
  const unit = cell * scale;
  const trunkW = unit * 2;
  const trunkH = unit * 18;
  px(ctx, x, groundY - trunkH, trunkW, trunkH, palette.trunk);
  px(ctx, x + trunkW * 0.58, groundY - trunkH, trunkW * 0.32, trunkH, rgba("#0b1015", 0.18));

  const canopy = [
    [-9, -23, 9, 6, palette.leaf],
    [-4, -27, 10, 7, palette.leafLight],
    [4, -24, 10, 7, palette.leaf],
    [-12, -18, 12, 7, palette.leafLight],
    [0, -18, 14, 8, palette.leaf],
    [8, -15, 10, 6, palette.leafLight],
  ];

  for (const [cx, cy, w, h, color] of canopy) {
    px(ctx, x + (cx + sway) * unit, groundY + cy * unit, w * unit, h * unit, color);
  }
}

function drawDevice(ctx, width, height, cell, palette, seed, pulse) {
  const screenW = Math.min(width * 0.25, cell * 34);
  const screenH = screenW * 0.58;
  const screenX = width * 0.58 - screenW / 2;
  const screenY = height * 0.55 - screenH / 2;
  const bezel = cell * 1.2;

  px(ctx, screenX - cell * 3, screenY + screenH + cell * 7, screenW + cell * 10, cell * 3, rgba("#050910", 0.28));
  px(ctx, screenX - bezel, screenY - bezel, screenW + bezel * 2, screenH + bezel * 2, palette.deviceShade);
  px(ctx, screenX, screenY, screenW, screenH, palette.device);
  px(ctx, screenX + cell, screenY + cell, screenW - cell * 2, screenH - cell * 2, palette.screen);

  for (let row = 0; row < 6; row += 1) {
    const y = screenY + cell * (2.2 + row * 1.5);
    const x = screenX + cell * (2 + Math.floor(hash2(row, 2, seed) * 4));
    const w = cell * (5 + Math.floor(hash2(row, 7, seed) * 13));
    px(ctx, x, y, w, Math.max(2, cell * 0.5), row % 2 ? rgba(palette.glow, 0.5) : rgba("#ffffff", 0.62));
    if (hash2(row, 11, seed) > 0.46) {
      px(ctx, x - cell, y - cell * 0.15, cell * 0.62, cell * 0.62, rgba(palette.accent, 0.7 + pulse * 0.2));
    }
  }

  ctx.fillStyle = mixHex(palette.device, palette.glow, 0.22);
  ctx.beginPath();
  ctx.moveTo(screenX - cell * 5, screenY + screenH + cell * 1.2);
  ctx.lineTo(screenX + screenW + cell * 5, screenY + screenH + cell * 1.2);
  ctx.lineTo(screenX + screenW + cell * 10, screenY + screenH + cell * 7);
  ctx.lineTo(screenX - cell * 10, screenY + screenH + cell * 7);
  ctx.closePath();
  ctx.fill();

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 14; column += 1) {
      if (hash2(column, row, seed) > 0.14) {
        px(
          ctx,
          screenX - cell * 5.2 + column * cell * 1.45,
          screenY + screenH + cell * 2 + row * cell,
          cell,
          cell * 0.62,
          rgba("#050910", 0.24),
        );
      }
    }
  }
}

function drawGrass(ctx, width, height, cell, palette, seed, motion) {
  const groundY = Math.round(height * 0.76 / cell) * cell;

  for (let y = groundY; y < height + cell; y += cell) {
    const t = (y - groundY) / Math.max(1, height - groundY);
    for (let x = -cell; x < width + cell; x += cell) {
      const column = Math.floor(x / cell);
      const row = Math.floor(y / cell);
      const noise = hash2(column, row, seed);
      const color =
        noise > 0.6
          ? mixHex(palette.grass, palette.grassShade, t * 0.75)
          : mixHex(palette.grassShade, "#09120f", t * 0.45);
      px(ctx, x, y, cell, cell, color);

      if (noise > 0.976 && y < height - cell * 5) {
        px(ctx, x, y - cell, cell, cell, rgba(palette.accent, 0.82));
      }

      if (noise > 0.92 && y < height - cell * 3) {
        px(
          ctx,
          x + cell * 0.25,
          y - cell * 0.35,
          cell * 0.75,
          cell * 0.75,
          rgba(palette.glow, 0.12 + Math.sin(motion * 11 + column) * 0.03),
        );
      }
    }
  }
}

function drawSignalArcs(ctx, x, y, cell, palette, pulse) {
  ctx.strokeStyle = rgba(palette.glow, 0.18 + pulse * 0.1);
  ctx.lineWidth = Math.max(1, cell * 0.16);

  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x, y, cell * (8 + i * 5 + pulse * 2), Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();
  }
}

function drawStars(ctx, width, height, cell, palette, seed) {
  for (let i = 0; i < 48; i += 1) {
    const x = Math.floor(hash2(i, 2, seed) * (width / cell)) * cell;
    const y = Math.floor(hash2(i, 7, seed) * (height * 0.34 / cell)) * cell;
    if (hash2(i, 14, seed) > 0.58) {
      px(ctx, x, y, cell * 0.7, cell * 0.7, rgba(palette.glow, 0.52));
    }
  }
}

function drawFooterArt(canvas, time, reducedMotion) {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) {
    return;
  }

  const scale = bounds.width < 700 ? 2.4 : 3.1;
  const width = Math.max(300, Math.round(bounds.width / scale));
  const height = Math.max(134, Math.round(bounds.height / scale));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  const scene = getSceneName();
  const theme = getThemeName();
  const palette = palettes[scene] || palettes.day;
  const seed = getDailySeed() + scene.length * 71 + (theme === "dark" ? 213 : 0);
  const cell = width < 420 ? CELL_MOBILE : CELL_DESKTOP;
  const motion = reducedMotion ? 0 : time * 0.00018;
  const pulse = reducedMotion ? 0.3 : (Math.sin(time * 0.0015) + 1) * 0.5;
  const phase = getDayPhase();

  drawSky(ctx, width, height, cell, palette);

  if (scene === "night") {
    drawStars(ctx, width, height, cell, palette, seed);
  }

  const sunX = clamp(width * (0.1 + phase * 0.8), width * 0.12, width * 0.88);
  const sunY = height * (0.16 + Math.sin(phase * Math.PI) * 0.11);
  drawBlockCircle(ctx, sunX, sunY, cell * 4.5, cell, rgba(palette.sun, 0.84));
  drawBlockCircle(ctx, sunX, sunY, cell * 2.7, cell, palette.sun);

  drawCloud(ctx, width * 0.06, height * 0.13, cell, palette, width < 420 ? 0.72 : 0.98, motion * 4, 0.9);
  drawCloud(ctx, width * 0.31, height * 0.21, cell, palette, width < 420 ? 0.62 : 0.82, motion * 3 + 3, 0.78);
  drawCloud(ctx, width * 0.69, height * 0.14, cell, palette, width < 420 ? 0.6 : 0.76, motion * 2 + 5, 0.68);

  drawCity(ctx, width, height, cell, palette, seed);
  drawRidge(ctx, width, height, cell, seed, palette.hillBack, 0.61, 0.038, 0.12, motion * 3);
  drawRidge(ctx, width, height, cell, seed + 19, palette.hillFront, 0.69, 0.032, 0.1, -motion * 2.4);

  drawSignalArcs(ctx, width * 0.12, height * 0.78, cell, palette, pulse);
  drawSignalArcs(ctx, width * 0.88, height * 0.78, cell, palette, 1 - pulse);
  drawDevice(ctx, width, height, cell, palette, seed, pulse);

  if (width > 360) {
    drawTree(ctx, width * 0.86, height * 0.78, cell, palette, width < 520 ? 0.56 : 0.72, Math.sin(motion * 5) * 0.4);
  }

  drawGrass(ctx, width, height, cell, palette, seed, motion);
  px(ctx, 0, height - cell * 3, width, cell * 3, rgba("#050910", 0.3));
}

export function FooterSignalArt() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;

    if (!canvas || !wrapper) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let active = false;
    let reducedMotion = reducedMotionQuery.matches;
    let lastFrame = 0;

    const render = (time = performance.now()) => {
      drawFooterArt(canvas, time, reducedMotion);
    };

    const tick = (time) => {
      if (!active) {
        return;
      }

      if (time - lastFrame > 80) {
        render(time);
        lastFrame = time;
      }

      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const start = () => {
      if (active) {
        return;
      }
      active = true;
      frameId = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      active = false;
      window.cancelAnimationFrame(frameId);
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          render();
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "140px" },
    );

    const resizeObserver = new ResizeObserver(() => {
      render();
    });

    const mutationObserver = new MutationObserver(() => {
      render();
    });

    const handleMotionChange = (event) => {
      reducedMotion = event.matches;
      render();
      if (!reducedMotion) {
        start();
      }
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
    intersectionObserver.observe(wrapper);
    resizeObserver.observe(wrapper);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-scene", "data-theme"],
    });
    reducedMotionQuery.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="relative h-[20rem] overflow-hidden bg-[#1f9adb] md:h-[24rem] lg:h-[27rem]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%,rgba(5,8,12,0.18)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent)]" />
    </div>
  );
}
