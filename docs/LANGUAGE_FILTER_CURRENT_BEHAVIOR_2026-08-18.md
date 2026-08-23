# Language Filter: Current Experimental Behavior

FilterTube can filter Main YouTube videos by the language YouTube identifies for
the video's default spoken-audio track. For captionless videos, it can fall back
to strong writing-system evidence in creator-supplied Player metadata. The
control is available in the popup and at the bottom of **Filters > Content
Controls > Language Filters**. Its placement below the stable controls is
intentional while the feature remains experimental.

This feature is currently **Experimental**. YouTube does not expose reliable
spoken-language metadata on every recommendation, so unresolved videos remain
visible until reliable evidence is available instead of blanking the feed or
Watch rail.

The separate **Always Use Original Audio (Experimental)** Player control does
not filter videos by language. It only selects a proven original audio track on
the currently open video and makes no extra metadata request. See
`docs/ORIGINAL_AUDIO_PREFERENCE_2026-08-18.md`.

## What FilterTube reads

FilterTube reuses the same paced Player-response lookup used for official video
categories and description metadata. It does not download captions and it does
not make a second language-only request.

The strongest evidence comes from the Player streaming formats:

```text
streamingData.formats[].audioTrack
streamingData.adaptiveFormats[].audioTrack
  id
  displayName
  audioIsDefault
  isAutoDubbed
```

Caption/audio linkage remains the next fallback:

```text
captions.playerCaptionsTracklistRenderer
  defaultAudioTrackIndex
  audioTracks[].defaultCaptionTrackIndex
  captionTracks[].languageCode
```

The selection order is:

1. the explicit default, non-auto-dubbed `streamingData.audioTrack`;
2. the caption track linked to YouTube's default audio track;
3. one unambiguous automatic-speech-recognition track;
4. one unambiguous linked caption language;
5. strong writing-system evidence in the Player title, description, or tags;
6. otherwise `und` (language unavailable).

Available auto-dubs do not redefine the video's source language. For example,
a Firstpost video whose formats identify `English (US) original` remains
English even when YouTube also offers Russian, Hindi, Arabic, and other
auto-dubbed tracks. A future, separate "available dubbed language" policy could
answer a different question, but it is not mixed into this filter.

FilterTube deliberately ignores `translationLanguages`, YouTube's interface
language, country settings, and channel locale. A text fallback is accepted
only when the creator-supplied Player title, description, or tags contain a
strong supported writing-system signal. Weak and ambiguous Latin-script text
remains unavailable rather than being guessed.

## Request and cache behavior

For a visible video FilterTube first reuses an already loaded
`ytInitialPlayerResponse`. If more metadata is needed, category, language,
description, duration, dates, and channel identity needs are merged into one
Player request for that video. Requests are limited to visible/nearby cards,
paced through the existing queue, deduplicated while in flight, and cached by
video ID in `videoMetaMap`.

This avoids one request for category plus another for language. Scrolling may
still cause new lookups for newly visible uncached videos; revisiting a cached
video does not require another lookup until the cache expires or is replaced.

### Watch rail and YouTube's Kevlar bundle

The `/s/_/ytmainappweb/_/js/.../m=kevlar_base_module,...` resource is a
versioned, compiled YouTube web-application bundle. It contains the client code
and renderer registrations that call routes such as `/youtubei/v1/next`,
`/youtubei/v1/player`, and `/youtubei/v1/browse`; it is not the current video's
metadata response and should not be parsed as a recommendation API.

The initial Watch response and later `/youtubei/v1/next` continuations supply
the actual right-rail candidates. Those compact renderers usually omit spoken
language, so FilterTube lets YouTube render them, reuses cached Player metadata,
and paces missing lookups only for nearby cards. A resolved non-matching card is
removed. An unresolved card remains visible while this feature is Experimental.
FilterTube filters YouTube's candidates; it does not ask YouTube to manufacture
replacement Russian or other language-specific recommendations. The rail can
therefore become sparse when few supplied candidates resolve to an allowed
language, but it must not be globally blank merely because metadata is pending.

## Modes

The mode selector and language picker are available only while the Language
Filter toggle is on. Turning the toggle off collapses the picker and disables
the mode selector without deleting the saved language selection.

- **Block selected** hides a video after its resolved language matches one of
  the selected languages. Missing or ambiguous language stays visible.
- **Allow only selected** blocks a video after its resolved language does not
  match the selected languages. Missing or ambiguous language remains visible
  while lookup runs and stays usable if no reliable result exists; FilterTube
  does not blank a page or pause Watch solely because language is unavailable.

Language codes use their stable base BCP-47 value. Selecting Portuguese (`pt`)
also matches `pt-BR`; selecting Chinese (`zh`) matches regional/script variants
such as `zh-Hans`.

## Boundaries

- The first implementation applies to Main YouTube. YouTube Kids is not shown a
  language control yet. The recorded `WEB_KIDS` `/youtubei/v1/player` responses
  contain playable audio formats, but the inspected samples do not identify a
  default/original spoken language through `audioTrack`, `audioTrackId`,
  `defaultAudioTrackIndex`, or an equivalent provider field.
- `kids_polymer_inlined_html_v2.js` is the compiled YouTube Kids web-client
  bundle, not a per-video response. It contains caption UI behavior (including
  a saved caption-language preference), but that preference identifies the
  viewer's caption selection, not the video's original spoken language.
- Kids browse cards contain titles and video IDs but no authoritative spoken
  language. FilterTube will not infer Kids language from a title, channel, or
  the `hl` interface locale. A Kids control should be added only after current
  `WEB_KIDS` Player responses provide a defensible original/default-audio
  contract.
- A dubbed video is classified by YouTube's default audio selection, not every
  audio track the viewer could manually choose.
- Some videos have no captions, ambiguous tracks, and no strong writing-system
  signal in creator metadata. They are recorded as unavailable rather than
  guessed.
- The filter is independent of the profile's keyword/channel Blocklist or
  Whitelist mode, just like Category Filters.
