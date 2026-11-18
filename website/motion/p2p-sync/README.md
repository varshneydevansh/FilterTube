# Device sync explainer

A silent 23.5-second video for the home page's device sync panel, made for parents: pair with a
short code or QR, check the safety words match, choose what to share, it goes straight to the
other device locked, and later changes stay in sync. The five steps and their names match the
Anatomy figure (components/p2p-anatomy.js), which sits below the video as "Look inside". Facts
follow docs/app/TECHNICAL_RUNTIME.md (Nanah) in the app repository: a 4-character code or QR,
safety words compared on both screens, a chosen share, an encrypted direct connection, and
auto-sync that is still in testing. The devices are drawn; Kriti is the cut-out from
public/mascots. Rendered with fframes 1.3.0 (Metal), 1280 x 720, 24 fps, 564 frames.

The scene start times in src/lib.rs (STARTS) are mirrored in components/p2p-sync-video.js so the
step buttons can jump to each scene; change both together.

From this folder (sharing study-loop's build directory saves a cold Skia build):

```sh
export CARGO_TARGET_DIR=../study-loop/target
cargo run --release -- inspect --fail-on warning
cargo run --release -- strip all -n 16 --columns 4 --width 480
cargo run --release -- preview 0s
cargo run --release -- render -o /tmp/p2p-raw.mp4
# Web encode (about 300 KB) and poster, from website/:
ffmpeg -y -i /tmp/p2p-raw.mp4 -c:v libx264 -preset slow -crf 28 -tune animation \
  -pix_fmt yuv420p -movflags +faststart -an public/videos/p2p/p2p-sync.mp4
ffmpeg -y -ss 3.3 -i /tmp/p2p-raw.mp4 -vframes 1 /tmp/p2p-poster.png
cwebp -q 78 /tmp/p2p-poster.png -o public/videos/p2p/p2p-sync-poster.webp
```

Renderer: https://github.com/dmtrKovalenko/fframes (MIT). DM Sans is under the SIL Open
Font License; see OFL-DMSans.txt.
