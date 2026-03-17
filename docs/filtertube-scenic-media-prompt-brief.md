# FilterTube Scenic Media Prompt Brief

## Purpose

This brief replaces the older generic scenic prompt set with a tighter system
anchored to the actual live homepage reference:

- `website/assets/videos/homepage/day/homepage_hero_day.mp4`

That day clip is now the visual DNA for the whole site.

Every future image or video should feel like it belongs to the same world:

- same calm lakefront logic
- same soft lens language
- same premium natural atmosphere
- same readable central negative space
- same restrained motion and trust-first mood

The route pages should not look like unrelated films. They should look like
different moments, distances, and uses of one FilterTube world.

---

## Overlay Verdict

This overlay is **too strong** as a default:

```html
<div class="absolute inset-0 bg-[#ffffff]/76 mix-blend-soft-light"></div>
```

At `76%`, it will usually wash the scene out, flatten depth, and make the
video feel milky.

Recommended use:

- for scenic video heroes in light mode:
  - prefer `bg-[#f4efe8]/24` to `bg-[#f4efe8]/40`
  - keep `mix-blend-soft-light` only if the footage is too contrasty
- for scenic video heroes in dark mode:
  - reduce to `bg-white/6` to `bg-white/12`
  - often a subtle gradient is better than a full white wash
- for CSS illustration fallbacks:
  - soft-light overlays are more acceptable because the scene starts flatter

Better default direction:

```html
<div class="absolute inset-0 bg-[#f4efe8]/32 mix-blend-soft-light"></div>
```

or, even better for video:

```html
<div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03)_36%,rgba(14,18,24,0.10)_100%)]"></div>
```

Use white wash only as a finishing layer, not as the main readability fix.

---

## Global Rules

Apply these to both still images and videos.

- Keep the same world as the homepage day hero.
- Use a reflective lake or quiet water surface in the foreground or midground.
- Keep soft hills, meadow forms, flower detail, or shoreline layering.
- Leave readable negative space in the center for headline and CTA overlay.
- Avoid aggressive fantasy, neon sci-fi, oversized subjects, or busy skies.
- No text, no UI, no logos, no people, no animals near camera.
- No hard contrast spikes in the center.
- The mood must stay calm, local-first, protective, and expensive.

For videos only:

- 8 to 10 seconds
- seamless closed loop
- locked or near-locked camera
- no cuts
- motion only from water, flowers, grass, clouds, atmosphere, light shimmer

For images only:

- feel like a perfect poster frame taken from the matching video world
- preserve the same composition logic and negative space
- avoid over-detail in the text area

---

## Master Prompt Base

### Video Base

```text
Create a premium cinematic serene landscape video loop for the FilterTube website, using the existing homepage day hero clip as the visual anchor and world reference. The world should feel calm, trustworthy, airy, and expensive. Use soft natural lighting, elegant depth, gentle water reflections, distant hills, flowered meadow forms, slow cloud movement, and subtle atmosphere. Leave clean negative space in the center for headline and CTA overlay. No text, no UI, no logos, no people, no animals, no sudden motion, no cuts, no dramatic fantasy elements, no storms, no heavy parallax. The camera should remain locked or nearly locked. The loop must be perfectly seamless, with motion driven only by soft environmental details like water ripples, drifting petals, grass sway, cloud drift, and light shimmer. Premium website hero aesthetic, refined, believable, and calm.
```

### Image Base

```text
Create a premium scenic still image for the FilterTube website, using the existing homepage day hero clip as the visual anchor and world reference. The image should feel calm, trustworthy, airy, and expensive. Use soft natural lighting, elegant depth, gentle water reflections, distant hills, flowered meadow forms, and subtle atmosphere. Leave clean negative space in the center for headline and CTA overlay. No text, no UI, no logos, no people, no animals, no dramatic fantasy elements, no storms, no harsh contrast in the center. Premium website hero still, refined, believable, and calm.
```

---

## Time-of-Day Modifiers

Use one of these for every route.

### Dawn

```text
Time of day: early dawn. Pale blue sky warming into blush peach, light morning mist, delicate first sunlight, gentle reflective water, fresh and protective mood, quietly hopeful.
```

### Day

```text
Time of day: clear daytime. Soft luminous blue sky, sculpted white clouds, bright but not harsh sunlight, calm clarity, gentle water sparkle, restrained freshness.
```

### Sunset

```text
Time of day: warm sunset. Amber light, blush clouds, soft golden reflections on the water, long light across the landscape, winding-down mood, beautiful but restrained.
```

### Night

```text
Time of day: blue-hour into night. Deep navy sky, moonlit water, soft luminous clouds, faint stars, contemplative and safe mood, elegant contrast without cyber aesthetics.
```

---

## Route Modifiers

Use one of these per route directory.

### `homepage`

```text
Route direction: the defining FilterTube world. Gentle lakefront meadow, soft flower-covered hill forms, calm horizon, broad center space for the main headline. This is the primary visual reference for every other route.
```

### `footer`

```text
Route direction: the same FilterTube world, but wider, more grounded, and more conclusive. A landscaped shoreline or park-like waterfront with an ending-frame feeling. Less hero-centered, more horizon-led. Premium and reflective, closer to a calm closing scene.
```

### `mobile`

```text
Route direction: closer reading distance translated into nature. Gentle garden-lake world, slightly closer foreground detail, reassuring and simple, fast readability, calm handheld-scale intimacy without losing the homepage world.
```

### `ios`

```text
Route direction: pearl-toned refinement. Minimal lakeside composition with pale blue and cream tones, polished and precise, elegant negative space, highly controlled and clean.
```

### `ipados`

```text
Route direction: spacious and organized. Wider terrace-like view over water, layered horizontal depth, calm structure, more room and order, still part of the same world.
```

### `android`

```text
Route direction: greener and more grounded. Stronger earth tones, practical calm, slightly more structured landscape, still serene and premium, less delicate than iOS.
```

### `tv`

```text
Route direction: cinematic shared-screen valley. Larger silhouette shapes, simpler far-view composition, lake and distant hills designed to read from a sofa, shared-screen trust.
```

### `android-tv`

```text
Route direction: dusk-toned living-room equivalent in nature. Deeper blue lake, stronger horizon layers, subtle warm distant glow, large readable shapes, Android TV distance clarity.
```

### `fire-tv`

```text
Route direction: warmer family-screen variant. Amber dusk atmosphere, soft evening light, cozy reflections, calm household trust, premium but welcoming.
```

### `kids`

```text
Route direction: softer blossom valley. Pastel sky, rounded hills, lighter flower rhythm, playful but not childish, safer and gentler version of the same world.
```

### `ml-ai`

```text
Route direction: observatory-like quiet intelligence. Deeper navy atmosphere, calmer geometry in reflections, subtle star presence, intelligent but not sci-fi, local and explainable feeling.
```

---

## Prompt Assembly Rule

For each asset, combine:

1. the master base
2. the route modifier
3. the time-of-day modifier
4. the asset-specific suffix below

### Video Suffix

```text
Format: seamless loop, 8 to 10 seconds, static or near-static camera, no visible restart, no abrupt lighting shift, no object crossing frame, no flicker, no jitter.
```

### Image Suffix

```text
Format: still image for premium website use, poster-frame quality, clean center readability, no excessive center detail, refined and believable.
```

---

## Example Prompt Outputs

### Homepage / Sunset / Video

```text
Create a premium cinematic serene landscape video loop for the FilterTube website, using the existing homepage day hero clip as the visual anchor and world reference. The world should feel calm, trustworthy, airy, and expensive. Use soft natural lighting, elegant depth, gentle water reflections, distant hills, flowered meadow forms, slow cloud movement, and subtle atmosphere. Leave clean negative space in the center for headline and CTA overlay. No text, no UI, no logos, no people, no animals, no sudden motion, no cuts, no dramatic fantasy elements, no storms, no heavy parallax. The camera should remain locked or nearly locked. The loop must be perfectly seamless, with motion driven only by soft environmental details like water ripples, drifting petals, grass sway, cloud drift, and light shimmer. Premium website hero aesthetic, refined, believable, and calm.

Route direction: the defining FilterTube world. Gentle lakefront meadow, soft flower-covered hill forms, calm horizon, broad center space for the main headline. This is the primary visual reference for every other route.

Time of day: warm sunset. Amber light, blush clouds, soft golden reflections on the water, long light across the landscape, winding-down mood, beautiful but restrained.

Format: seamless loop, 8 to 10 seconds, static or near-static camera, no visible restart, no abrupt lighting shift, no object crossing frame, no flicker, no jitter.
```

### Footer / Night / Image

```text
Create a premium scenic still image for the FilterTube website, using the existing homepage day hero clip as the visual anchor and world reference. The image should feel calm, trustworthy, airy, and expensive. Use soft natural lighting, elegant depth, gentle water reflections, distant hills, flowered meadow forms, and subtle atmosphere. Leave clean negative space in the center for headline and CTA overlay. No text, no UI, no logos, no people, no animals, no dramatic fantasy elements, no storms, no harsh contrast in the center. Premium website hero still, refined, believable, and calm.

Route direction: the same FilterTube world, but wider, more grounded, and more conclusive. A landscaped shoreline or park-like waterfront with an ending-frame feeling. Less hero-centered, more horizon-led. Premium and reflective, closer to a calm closing scene.

Time of day: blue-hour into night. Deep navy sky, moonlit water, soft luminous clouds, faint stars, contemplative and safe mood, elegant contrast without cyber aesthetics.

Format: still image for premium website use, poster-frame quality, clean center readability, no excessive center detail, refined and believable.
```

### Android TV / Sunset / Video

```text
Create a premium cinematic serene landscape video loop for the FilterTube website, using the existing homepage day hero clip as the visual anchor and world reference. The world should feel calm, trustworthy, airy, and expensive. Use soft natural lighting, elegant depth, gentle water reflections, distant hills, flowered meadow forms, slow cloud movement, and subtle atmosphere. Leave clean negative space in the center for headline and CTA overlay. No text, no UI, no logos, no people, no animals, no sudden motion, no cuts, no dramatic fantasy elements, no storms, no heavy parallax. The camera should remain locked or nearly locked. The loop must be perfectly seamless, with motion driven only by soft environmental details like water ripples, drifting petals, grass sway, cloud drift, and light shimmer. Premium website hero aesthetic, refined, believable, and calm.

Route direction: dusk-toned living-room equivalent in nature. Deeper blue lake, stronger horizon layers, subtle warm distant glow, large readable shapes, Android TV distance clarity.

Time of day: warm sunset. Amber light, blush clouds, soft golden reflections on the water, long light across the landscape, winding-down mood, beautiful but restrained.

Format: seamless loop, 8 to 10 seconds, static or near-static camera, no visible restart, no abrupt lighting shift, no object crossing frame, no flicker, no jitter.
```

---

## Directory Mapping

Use the route modifier that matches each directory:

- `website/assets/videos/homepage` → `homepage`
- `website/assets/videos/footer` → `footer`
- `website/assets/videos/mobile` → `mobile`
- `website/assets/videos/ios` → `ios`
- `website/assets/videos/ipados` → `ipados`
- `website/assets/videos/android` → `android`
- `website/assets/videos/tv` → `tv`
- `website/assets/videos/android-tv` → `android-tv`
- `website/assets/videos/fire-tv` → `fire-tv`
- `website/assets/videos/kids` → `kids`
- `website/assets/videos/ml-ai` → `ml-ai`

Each of those route directories already contains:

- `dawn`
- `day`
- `sunset`
- `night`

That means each route can now generate:

- 4 video prompts
- 4 image prompts

using the same assembly system.

---

## Recommended Production Order

1. Homepage: all 4 times
2. Footer: all 4 times
3. One base still + one base loop each for:
   - `mobile`
   - `tv`
   - `kids`
   - `ml-ai`
4. Then expand the rest of the route directories

This keeps the site visually coherent before spending effort on every variant.
