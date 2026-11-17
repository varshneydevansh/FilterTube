# Avatar crayon ring (owner item 4)

Android source: `ProfileAvatar.kt` (`ProfileAvatarDrawable.draw`), `StudyPaper.crayon`, branch `feature/android-3.6.2-study`.

| | Android | Extension before | Extension now |
|---|---|---|---|
| Adult, Kids | One closed circle, inset by one stroke width, stroked with `crayon(ink, 1.6dp)`: ~5 dp pieces pushed sideways by up to 0.55 dp, corners rounded 2 dp, fixed seed | One SVG circle with a dash gap and a turbulence filter; Adult inked in near-black | `UIComponents.crayonRingPath()` draws the same thing as an SVG path (seeded, so it never changes between draws); Adult and Parent use plum on lilac like the app |
| Parent (Default) | The two scribbled loops, `doodle_scribble_circle`, tinted with the ink, inset 2% | Two dashed SVG circles | The app's own `scribble_circle.webp` (already shipped, byte-identical) as a mask tinted plum, inset 2% |

Every avatar goes through `renderProfileAvatar`, so the dashboard header badge, the active profile card, the popup badge, the profile picker and the profiles manager all changed together.

Files: `before-profiles-{light,dark}.jpg`, `after-profiles-{light,dark}.jpg`, `before-avatars-crop.png`, `after-avatars-crop.png`.

Not captured: the Android avatar on `emulator-5582`. Another session was using the emulator, so it was left alone.
