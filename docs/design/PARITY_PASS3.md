# Extension and app, side by side: third parity pass (2026-11-16)

Branch `feature/ext-parity-3`. The feature audit behind it is [EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md](EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md); the passes before it are [PARITY_PASS2.md](PARITY_PASS2.md) and [EXTENSION_UX_AUDIT_2026-11-16.md](EXTENSION_UX_AUDIT_2026-11-16.md).

Captures: [`screens-2026-11-16-pass3/`](screens-2026-11-16-pass3/), light and dark, 1360 px wide, Companion on Lively, taken in Chromium with the unpacked extension. In-page screens are rendered on a stand-in video page with a stub extension API. The app's reference screens are the ones copied for pass 2, in [`screens-2026-11-16-pass2/android/`](screens-2026-11-16-pass2/android/).

## What this pass changed

| Area | Android app | Extension before | Now |
|---|---|---|---|
| Kids allowed videos | `videoIds` are the parent's allowed videos | Read as blocked videos | Allowed, in Allowed only, never above a block |
| Kids words from the app | Plain strings; regex, date, paused rows honoured | Dropped (only `entry.word` was read) | The same compiler as Main |
| Comments in Allowed only | Only allowed authors or allowed words | Every comment showed | As the app, in the data and on the page |
| Profile switch during study | Parent's PIN typed now; Locked refuses; Gentle ends first | Self-Control check only | As the app; the background reverts any switch it didn't allow |
| Child self-setup, popup PIN tries, restore during study | Refused, limited, held | Allowed | As the app |
| Relay disclosure | Asked once before internet sync | None | As the app |
| Hub | Header, Today card, tiles | Hero copy, Play button, apps and preview blocks | Header, Today card, tiles; rolling numbers; Kriti's peek when empty |
| Rule removal | Paper undo bar, batched | Nothing | The app's bar and timings |
| New rule | Area wash and crayon underline; first-filter moment | Nothing | Both |
| Keyword rows, popup fields | Word line then chip row; 48 dp fields | One line; 63 px fields | As the app |
| In-page shoo | Three plays a day, then Uljhan's shrug | Every time | As the app |
| Pairing | Kriti thinking while waiting | No character | Kriti thinking beside the code |
| Time-limit screen, viewing-route gate | Paper, Delius, brick pill | Glass, other fonts | Paper and Delius, with Kriti (mug, thinking, pointing) |
| Welcome | Three pages | One card, skipped with the Companion Off | Three pages, words stand alone when Off |
| Web fonts | Bundled | Google Fonts requested | Bundled only |

## Side by side

Each row: the app on the left, the extension on the right.

### Hub

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass2/android/hub-light.jpg) | ![](screens-2026-11-16-pass3/tab-dashboard-light.jpg) |
| ![](screens-2026-11-16-pass2/android/hub-dark.jpg) | ![](screens-2026-11-16-pass3/tab-dashboard-dark.jpg) |

Kriti's peek over an empty hub: [light](screens-2026-11-16-pass3/tab-dashboard-peek-light.jpg), [dark](screens-2026-11-16-pass3/tab-dashboard-peek-dark.jpg).

### Words: rows, undo, first filter

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass2/android/words-light.jpg) | ![](screens-2026-11-16-pass3/tab-filters-rows-undo-light.jpg) |
| ![](screens-2026-11-16-pass2/android/channels-dark.jpg) | ![](screens-2026-11-16-pass3/tab-filters-rows-undo-dark.jpg) |
| ![](screens-2026-11-16-pass2/android/words-empty.jpg) | ![](screens-2026-11-16-pass3/tab-filters-first-filter-light.jpg) |

First filter, dark: [here](screens-2026-11-16-pass3/tab-filters-first-filter-dark.jpg). Plain list: [light](screens-2026-11-16-pass3/tab-filters-keywords-light.jpg), [dark](screens-2026-11-16-pass3/tab-filters-keywords-dark.jpg); empty search: [light](screens-2026-11-16-pass3/tab-filters-search-empty-light.jpg), [dark](screens-2026-11-16-pass3/tab-filters-search-empty-dark.jpg).

### Welcome

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass2/android/welcome-light.jpg) | ![](screens-2026-11-16-pass3/first-run-light.jpg) |

Dark: [here](screens-2026-11-16-pass3/first-run-dark.jpg).

### Time limit and viewing-route gate (in page)

| Android (study break, the same paper sheet) | Extension |
|---|---|
| ![](screens-2026-11-16-pass2/android/study-break-light.jpg) | ![](screens-2026-11-16-pass3/inpage-time-limit-light.jpg) |
| ![](screens-2026-11-16-pass2/android/kids-askparent-light.jpg) | ![](screens-2026-11-16-pass3/inpage-time-limit-review-light.jpg) |

Dark: [time limit](screens-2026-11-16-pass3/inpage-time-limit-dark.jpg), [parent review](screens-2026-11-16-pass3/inpage-time-limit-review-dark.jpg). Viewing-route gate: [light](screens-2026-11-16-pass3/inpage-route-gate-light.jpg), [dark](screens-2026-11-16-pass3/inpage-route-gate-dark.jpg).

### Content controls, Kids

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass2/android/content-light.jpg) | ![](screens-2026-11-16-pass3/tab-content-controls-light.jpg) |
| ![](screens-2026-11-16-pass2/android/kids-tablet.jpg) | ![](screens-2026-11-16-pass3/tab-kids-light.jpg) |

Dark: [content](screens-2026-11-16-pass3/tab-content-controls-dark.jpg), [kids](screens-2026-11-16-pass3/tab-kids-dark.jpg).

### Settings, Study, Backup, Sync, Profiles

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass2/android/settings-light.jpg) | ![](screens-2026-11-16-pass3/tab-settings-light.jpg) |
| ![](screens-2026-11-16-pass2/android/study-idle-light.jpg) | ![](screens-2026-11-16-pass3/tab-study-light.jpg) |
| ![](screens-2026-11-16-pass2/android/profiles-picker-dark.jpg) | ![](screens-2026-11-16-pass3/tab-profiles-dark.jpg) |

Also: [backup](screens-2026-11-16-pass3/tab-backup-light.jpg), [backup, dark](screens-2026-11-16-pass3/tab-backup-dark.jpg), [sync](screens-2026-11-16-pass3/tab-sync-light.jpg), [sync, dark](screens-2026-11-16-pass3/tab-sync-dark.jpg), [settings, dark](screens-2026-11-16-pass3/tab-settings-dark.jpg), [study, dark](screens-2026-11-16-pass3/tab-study-dark.jpg), [profiles](screens-2026-11-16-pass3/tab-profiles-light.jpg).

### Support, About, What's new, Help

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass2/android/support-light.jpg) | ![](screens-2026-11-16-pass3/tab-support-light.jpg) |

Also: [support, dark](screens-2026-11-16-pass3/tab-support-dark.jpg), [about](screens-2026-11-16-pass3/tab-about-light.jpg), [about, dark](screens-2026-11-16-pass3/tab-about-dark.jpg), [what's new](screens-2026-11-16-pass3/tab-whatsnew-light.jpg), [what's new, dark](screens-2026-11-16-pass3/tab-whatsnew-dark.jpg), [help](screens-2026-11-16-pass3/tab-help-light.jpg), [help, dark](screens-2026-11-16-pass3/tab-help-dark.jpg).

### Popup and states

| Popup | Blocked video |
|---|---|
| ![](screens-2026-11-16-pass3/popup-light.jpg) | ![](screens-2026-11-16-pass3/inpage-blocked-video-light.jpg) |
| ![](screens-2026-11-16-pass3/popup-dark.jpg) | ![](screens-2026-11-16-pass3/inpage-blocked-video-dark.jpg) |

- Offline popup: [light](screens-2026-11-16-pass3/popup-offline-light.jpg), [dark](screens-2026-11-16-pass3/popup-offline-dark.jpg).
- Connection strip: [offline](screens-2026-11-16-pass3/state-offline-light.jpg), [offline, dark](screens-2026-11-16-pass3/state-offline-dark.jpg), [back online](screens-2026-11-16-pass3/state-back-online-light.jpg), [back online, dark](screens-2026-11-16-pass3/state-back-online-dark.jpg).
- Toasts: [success](screens-2026-11-16-pass3/state-toast-success-light.jpg), [success, dark](screens-2026-11-16-pass3/state-toast-success-dark.jpg), [error](screens-2026-11-16-pass3/state-toast-error-light.jpg), [error, dark](screens-2026-11-16-pass3/state-toast-error-dark.jpg).
- Moments: [light](screens-2026-11-16-pass3/state-moments-light.jpg), [dark](screens-2026-11-16-pass3/state-moments-dark.jpg).
- Study in page: [gate, off plan](screens-2026-11-16-pass3/inpage-study-gate-off-plan-light.jpg), [gate, not now](screens-2026-11-16-pass3/inpage-study-gate-not-now-dark.jpg), [break](screens-2026-11-16-pass3/inpage-study-break-light.jpg), [done for today](screens-2026-11-16-pass3/inpage-study-done-for-today-dark.jpg), [checking](screens-2026-11-16-pass3/inpage-checking-light.jpg), [first-run prompt](screens-2026-11-16-pass3/inpage-first-run-prompt-light.jpg).

The blocked-video capture is one of the day's three shoo plays, caught mid-sheet; from the fourth blocked video of the day (and on Quiet) the card shows Uljhan's shrug still instead (`tests/runtime/mascots.test.mjs`).

## Left for later

- **Missing:** Ask a parent and "Allow once"; live-chat message filtering; "Skip this video"; the comment "hidden · Undo" note on the site.
- **Partial:** an allowed word with the channel not known yet shows instead of waiting; collab cards decide on a partial collaborator list; a channel rule's name matches only when the card has no UC id; the "Filter all" word has no handle or id fallback.
- **Partial, unverified:** a Kids-site direct watch link during a Kids learning round relies on the data-level filter; the page's watch gate returns early on that site. Needs a check on the live Kids site.
- **Partial:** the background trusts the active profile for Family control edits (the options page gates the view; the app asks for a fresh parent unlock); a parent's lock arriving during a child's own Self-Control session may be undone by the session snapshot.
- **Partial:** a Gentle session asks you to end it before switching, where the app ends it for you after the 30-second pause.
- **Partial:** doodles have no heart or sparkle; four of the app's nine support variants stay out because their words aren't true for the extension; channel rows keep the extension's node-mapping layout; the study setup has no search explainer.
- The popup keeps its "Open FilterTube on Google Play" row; only the dashboard's promotion was removed, as asked.
