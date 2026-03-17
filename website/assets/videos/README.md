## Video Asset Map

This folder is the workspace source location for generated scenic loops.

Prompt system:
- see `/Users/devanshvarshney/FilterTube/docs/filtertube-scenic-media-prompt-brief.md`
- that brief now treats `homepage/day/homepage_hero_day.mp4` as the visual anchor
- use the same route/time prompt system for both still images and video loops

Important:
- Next.js serves live videos from `website/public/videos`
- keep your generation masters here if you want
- copy the finished runtime file into the matching `public/videos/...` folder before using it on the site

Current live homepage hero runtime source:
- `website/public/videos/homepage/day/homepage_hero_day.mp4`

Current workspace master:
- `homepage/day/homepage_hero_day.mp4`

Recommended naming:
- `homepage_hero_dawn.mp4`
- `homepage_hero_day.mp4`
- `homepage_hero_sunset.mp4`
- `homepage_hero_night.mp4`
- `footer_dawn.mp4`
- `footer_day.mp4`
- `footer_sunset.mp4`
- `footer_night.mp4`
- `<route>_dawn.mp4`
- `<route>_day.mp4`
- `<route>_sunset.mp4`
- `<route>_night.mp4`

Route folder list:
- `homepage`
- `footer`
- `mobile`
- `ios`
- `ipados`
- `android`
- `tv`
- `android-tv`
- `fire-tv`
- `kids`
- `ml-ai`

Time-of-day folders already created for each route:
- `dawn`
- `day`
- `sunset`
- `night`

Suggested drop pattern:
- place the finished video in both the route root and the matching time folder while generation is in progress
- then copy the final runtime file into the matching `website/public/videos/...` path
- example:
  - `android-tv/android_tv_day.mp4`
  - `android-tv/day/android_tv_day.mp4`

Once all videos exist, the site can be switched to a route-aware and time-aware video map.
