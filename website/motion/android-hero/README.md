# Android hero contour loop

Original FilterTube Rust/SVG composition, rendered with fframes 1.3.0 (Metal).
1280 x 720, 24 fps, 8 seconds, 192 frames; intentionally silent. Sage, cream and
peach match the existing website. The cyclic geometry closes without a scene cut.
There is no product UI, stock media, performance claim or user data in the loop.

From this folder:

```sh
cargo run --release -- timeline
cargo run --release -- inspect --fail-on warning
cargo run --release -- strip -n 8 --width 360
cargo run --release -- preview 0s
cargo run --release -- render -o ../../public/videos/android/android-contours.mp4
```

The webpage provides a static poster and pause control. It stops motion for
reduced-motion preference, offscreen content and hidden tabs. Screenshots stay
interactive DOM elements above the video. The generated starter font is bundled
only for the CLI media provider; this composition renders no text.

Renderer: https://github.com/dmtrKovalenko/fframes (MIT). The bundled DM Sans font
is distributed under the SIL Open Font License; see media/OFL.txt.
