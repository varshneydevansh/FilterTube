"""Cut the website's Kriti and Uljhan art from the aKriti brand library sheets.

Not part of the Next.js build. Run it again only when the source sheets change:

    python3 -m venv venv && venv/bin/pip install numpy scipy pillow
    venv/bin/python website/tools/cut-mascots.py ~/aKriti-brand-library website/public/mascots

Animated motions become one horizontal strip per motion (frames share a canvas and a
baseline, so CSS steps() can play them without jitter). Poses become single trimmed stills.
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

TOL = 28          # ink vs paper
HOLE_TOL = 18     # only near-pure white holes are cleared (keeps cream signs and book pages)
HOLE_MIN = 250


def least_ink_cuts(profile, lo_edge, hi_edge, n):
    step = (hi_edge - lo_edge) / n
    cuts = [lo_edge]
    smooth = ndimage.uniform_filter1d(profile.astype(float), 9)
    for k in range(1, n):
        c = int(lo_edge + k * step)
        lo, hi = c - int(step * .3), c + int(step * .3)
        cuts.append(lo + int(np.argmin(smooth[lo:hi])))
    cuts.append(hi_edge + 1)
    return cuts, step


def cutout(sub):
    """RGB cell -> RGBA with edge-connected paper and large white holes made transparent."""
    darkness = (255 - sub).max(axis=2)
    paper = darkness < TOL
    lab, _ = ndimage.label(paper)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    white = darkness < HOLE_TOL
    hl, n = ndimage.label(white & ~bg)
    if n:
        sizes = ndimage.sum(white & ~bg, hl, range(1, n + 1))
        bg |= np.isin(hl, [i + 1 for i, s in enumerate(sizes) if s >= HOLE_MIN])
    # Drop slivers of the neighbouring frame: small shapes that touch the left or right cut.
    shapes, count = ndimage.label(ndimage.binary_dilation(~bg, iterations=3))
    if count > 1:
        areas = ndimage.sum(~bg, shapes, range(1, count + 1))
        total = areas.sum()
        for i, area in enumerate(areas, start=1):
            cols = np.nonzero((shapes == i).any(axis=0))[0]
            if (cols.min() == 0 or cols.max() == sub.shape[1] - 1) and area < total * 0.08:
                bg |= shapes == i
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    ring = ndimage.binary_dilation(bg) & ~bg
    alpha[ring] = np.clip(darkness[ring] * 3, 0, 255)
    return np.dstack([sub.astype(np.uint8), alpha])


def split_grid(path, rows, cols, pad=10):
    """Return frames (row-major) on one shared canvas, aligned to each row's grid and baseline."""
    rgb = np.array(Image.open(path).convert("RGB")).astype(int)
    ink = (255 - rgb).max(axis=2) >= TOL
    ys = np.nonzero(ink.any(axis=1))[0]
    rcuts, _ = least_ink_cuts(ink.sum(axis=1), ys.min(), ys.max(), rows)
    pieces = []
    for r in range(rows):
        band = rgb[rcuts[r]:rcuts[r + 1]]
        bink = ink[rcuts[r]:rcuts[r + 1]]
        bys = np.nonzero(bink.any(axis=1))[0]
        top, bottom = bys.min(), bys.max()
        xs = np.nonzero(bink.any(axis=0))[0]
        ccuts, step = least_ink_cuts(bink.sum(axis=0), xs.min(), xs.max(), cols)
        for c in range(cols):
            sub = band[top:bottom + 1, ccuts[c]:ccuts[c + 1]]
            ideal = xs.min() + c * step
            pieces.append((cutout(sub), ccuts[c] - ideal, step))
    W = int(max(p[2] for p in pieces) + max(abs(p[1]) for p in pieces) * 2 + max(p[0].shape[1] - p[2] for p in pieces) + 2 * pad)
    H = max(p[0].shape[0] for p in pieces) + 2 * pad
    frames = []
    for arr, off, _ in pieces:
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        x = int(pad + max(0, off))
        canvas.paste(Image.fromarray(arr), (x, H - pad - arr.shape[0]))
        frames.append(canvas)
    return frames


def trim_common(frames, pad=6):
    boxes = [f.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox() for f in frames]
    boxes = [b for b in boxes if b]
    x0 = max(0, min(b[0] for b in boxes) - pad); y0 = max(0, min(b[1] for b in boxes) - pad)
    x1 = min(frames[0].width, max(b[2] for b in boxes) + pad); y1 = min(frames[0].height, max(b[3] for b in boxes) + pad)
    return [f.crop((x0, y0, x1, y1)) for f in frames]


def save_strip(frames, height, out, quality=72):
    frames = trim_common(frames)
    w = round(frames[0].width * height / frames[0].height)
    strip = Image.new("RGBA", (w * len(frames), height), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f.resize((w, height), Image.LANCZOS), (i * w, 0))
    strip.save(out, "WEBP", quality=quality, method=6)
    print(f"{out}: {len(frames)} frames of {w}x{height}, {os.path.getsize(out)//1024} KB")


def save_poses(frames, names, height, out_dir, quality=80):
    trimmed = [trim_common([f]) [0] for f in frames]
    scale = height / max(t.height for t in trimmed)
    for t, name in zip(trimmed, names):
        if not name:
            continue
        size = (round(t.width * scale), round(t.height * scale))
        path = os.path.join(out_dir, f"{name}.webp")
        t.resize(size, Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)
        print(f"{path}: {size[0]}x{size[1]}, {os.path.getsize(path)//1024} KB")


def main(lib, out):
    os.makedirs(out, exist_ok=True)
    g = os.path.join(lib, "sheets", "generic")
    save_strip(split_grid(os.path.join(g, "duo_sieve_loop_v3_redfunnel_sheet.png"), 2, 6), 260, os.path.join(out, "duo-sieve-v3.webp"))
    save_strip(split_grid(os.path.join(g, "duo_milestone_medal_sheet.png"), 1, 6), 240, os.path.join(out, "duo-medal.webp"))
    untangle_dir = os.path.join(lib, "frames", "duo_offline_untangle")
    untangle = [Image.open(os.path.join(untangle_dir, f)).convert("RGBA") for f in sorted(os.listdir(untangle_dir)) if f.endswith(".png")]
    save_strip(untangle, 260, os.path.join(out, "duo-untangle.webp"))
    save_poses(split_grid(os.path.join(g, "kriti_poses_sheet.png"), 2, 4),
               ["kriti-wave", "kriti-cheer", "kriti-think", "kriti-read", "kriti-sleepy", "kriti-proud", "kriti-shh", "kriti-point"],
               280, out)
    save_poses(split_grid(os.path.join(g, "uljhan_poses_sheet.png"), 2, 3),
               ["uljhan-peek", "uljhan-shrug", "uljhan-tangled", "uljhan-hop", "uljhan-tiptoe", "uljhan-asleep"],
               240, out)


if __name__ == "__main__":
    main(os.path.expanduser(sys.argv[1]), sys.argv[2])
