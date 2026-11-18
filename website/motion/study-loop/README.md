# Study session loop

A silent 12-second loop for the home page's Study section: a study round with only the plan's
channels, comments off during the round, a break, then "That counts". The phone shows the
site's real Pixel captures (public/apps/screenshots/android/phone-study-*.webp and
phone-watch-study.webp, resized to PNG in media/), and Kriti is the cut-out art from
public/mascots. Rendered with fframes 1.3.0 (Metal), 1280 x 720, 24 fps, 288 frames.

From this folder:

```sh
cargo run --release -- inspect --fail-on warning
cargo run --release -- strip all -n 12 --columns 4 --width 480
cargo run --release -- preview 0s
cargo run --release -- render -o /tmp/study-loop-raw.mp4
# Web encode (about 270 KB) and poster, from website/:
ffmpeg -y -i /tmp/study-loop-raw.mp4 -vf scale=960:540:flags=lanczos -c:v libx264 -preset slow \
  -crf 27 -tune animation -pix_fmt yuv420p -movflags +faststart -an public/videos/study/study-loop.mp4
ffmpeg -y -i /tmp/study-loop-raw.mp4 -vframes 1 -vf scale=960:540 /tmp/poster.png
sips -s format jpeg -s formatOptions 82 /tmp/poster.png --out public/videos/study/study-loop-poster.jpg
```

When the Study captures change, re-run the `sips` resize into media/ and render again.
The page plays it muted, only on screen, never under reduced motion, with a pause control.

Renderer: https://github.com/dmtrKovalenko/fframes (MIT). DM Sans is under the SIL Open
Font License; see OFL-DMSans.txt.
