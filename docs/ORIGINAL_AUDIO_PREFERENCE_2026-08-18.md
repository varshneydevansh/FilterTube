# Always Use Original Audio: Experimental Playback Preference

FilterTube can ask Main YouTube's existing player to use the creator's original
audio track instead of an automatic dub. The control is under **Filters >
Content Controls > Player** as **Always Use Original Audio (Experimental)**.

This is a playback preference, not a video-language filter. It does not change
search results, recommendations, titles, descriptions, captions, or which
videos are allowed. It only changes the selected audio track for the video that
is already open.

## Evidence and selection

FilterTube reuses the Player response YouTube already loaded. It examines:

```text
streamingData.formats[].audioTrack
streamingData.adaptiveFormats[].audioTrack
  id
  languageCode
  displayName
  audioIsDefault
  isAutoDubbed
```

A track is considered proven original when it is not marked auto-dubbed and
either its display name identifies it as original or YouTube marks it as the
source/default non-auto-dubbed track. If that evidence is absent or ambiguous,
FilterTube leaves playback unchanged.

After the video player is ready, FilterTube uses YouTube's own in-page player
methods—`getAvailableAudioTracks()`, `getAudioTrack()`, and `setAudioTrack()`—to
select the matching source track. A small bounded set of delayed checks handles
YouTube applying its saved language preference late during player startup. It
does not continuously poll.

## Network and playback boundary

- No additional Player, caption, timed-text, Watch, or language request is made
  for this preference.
- Playback is never covered, paused, or delayed while FilterTube looks for a
  track.
- If only one track exists, the player API is unavailable, the video changes
  during navigation, or the original track cannot be matched uniquely, the
  current audio remains untouched.
- The preference is reapplied for SPA Watch navigation, autoplay, playlist and
  Mix transitions when their already-loaded Player response supplies proof.
- YouTube Kids is excluded until its player exposes an equally defensible
  original-track contract.

## Difference from YouTube preferred languages

YouTube's preferred-language setting covers audio, translated titles, and
descriptions for the languages a viewer selects. FilterTube's control is
narrower: whenever the source track can be proven, it prefers that track
regardless of the video's language, without changing translated metadata.
