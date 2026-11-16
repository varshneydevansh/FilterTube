# Extension and app, side by side: fourth parity pass (2026-11-16)

Branch `feature/ext-parity-4`, from `feature/ext-parity` (`25f9cc56`). The feature audit is [EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md](EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md); the passes before it are [PARITY_PASS3.md](PARITY_PASS3.md), [PARITY_PASS2.md](PARITY_PASS2.md) and [EXTENSION_UX_AUDIT_2026-11-16.md](EXTENSION_UX_AUDIT_2026-11-16.md). Source of truth: the Android app at `feature/android-3.6.2-study`.

Captures: [`screens-2026-11-16-pass4/`](screens-2026-11-16-pass4/), light and dark. Unlike pass 3, the in-page screens were taken **on the live site** in Chromium with the unpacked extension (Companion on Lively). The video site keeps its own light theme when signed out, so "dark" changes only FilterTube's own surfaces there. The app's reference screens for Ask a parent are copied from the app's `docs/app/family/screens/` into [`screens-2026-11-16-pass4/android/`](screens-2026-11-16-pass4/android/).

## What this pass changed

| Area | Android app | Extension before | Now |
|---|---|---|---|
| A card whose channel isn't known yet | An allowed word waits under layered rules while a blocked channel could match; an allow-mode Short never shows on a topic; a name alone never stands in for the channel | An allowed word always showed it | As the app, in the data filter and the page scan |
| A collaboration still loading ("A and 2 more") | Waits for the full list unless a known channel hits a rule | Decided on the partial list | As the app |
| Channel names | One key set: a rule's name or handle meets the card's name or handle | Names ignored when the card had another UC id | As the app |
| "Filter all" word | Name unless it is the id, then handle, handle display, canonical handle, custom URL, id | Name, handle, id | As the app |
| Family edits | A PIN typed in the last 5 minutes | The options page gated the view only | Checked in the background for every edit; the PIN is asked inline |
| Gentle study and a profile switch | "End and switch": ends after the 30-second pause, then switches | Said it ends first, nothing more | As the app |
| Ask a parent, "Allow once" | Video and channel asks, Requests, signed answers over `study_family` | Missing | Video asks, Requests, "Allow once", "Always allow this channel", "Let Aarav ask", the same signed messages |
| Live chat | Each message under the full rules | Hide-live-chat toggle only | Each message under the full rules |
| "Skip this video" | During study | Missing | On the watch page during study |
| "Comments from X hidden · Undo" | In the comments sheet | Missing | Where the blocked comment was |
| Doodles | Heart and sparkle as passing moments | Missing | Where the app plays them |
| Kids site, direct watch link, learning round | (no Kids website) | Data filter only | The watch gate runs during a Kids learning round |

## Cross-platform fixtures

`tests/runtime/fixtures/app-parity/channel-decisions.json` holds the app's own cases (each row names the app test or line it comes from): the pending-channel decision, identity strength, name matching, "A and N more" and the "Filter all" word. `tests/runtime/app-parity-channel-decisions.test.mjs` runs them against the shared helpers, the options page's copy and the data-level filter end to end. `app-parity-ask-parent.test.mjs` ports AskParentTest (limits, authority, signed answers with real Ed25519 keys, end to end over `study_family`), `app-parity-live-chat.test.mjs` ports NativeMainLiveChatFilterRulesTest.

## Side by side

### Ask a parent: the child asks

| Android | Extension (live site) |
|---|---|
| ![](screens-2026-11-16-pass4/android/ask-parent-ask-light.jpg) | ![](screens-2026-11-16-pass4/inpage-ask-sheet-light.jpg) |
| ![](screens-2026-11-16-pass4/android/ask-parent-sent-light.jpg) | ![](screens-2026-11-16-pass4/inpage-ask-sent-light.jpg) |

The blocked card with "Ask to watch": [light](screens-2026-11-16-pass4/inpage-ask-button-light.jpg), [dark](screens-2026-11-16-pass4/inpage-ask-button-dark.jpg). Dark sheet and sent: [sheet](screens-2026-11-16-pass4/inpage-ask-sheet-dark.jpg), [sent](screens-2026-11-16-pass4/inpage-ask-sent-dark.jpg).

### Ask a parent: the parent answers

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass4/android/ask-parent-card-light.jpg) | ![](screens-2026-11-16-pass4/tab-requests-light.jpg) |
| ![](screens-2026-11-16-pass4/android/ask-parent-card-dark.jpg) | ![](screens-2026-11-16-pass4/tab-requests-dark.jpg) |

The hub's "Requests · 1" row: [light](screens-2026-11-16-pass4/tab-hub-requests-light.jpg), [dark](screens-2026-11-16-pass4/tab-hub-requests-dark.jpg). After "Allow once": [light](screens-2026-11-16-pass4/tab-requests-answered-light.jpg), [dark](screens-2026-11-16-pass4/tab-requests-answered-dark.jpg).

### Ask a parent: the answer

| Android | Extension |
|---|---|
| ![](screens-2026-11-16-pass4/android/ask-parent-yes-light.jpg) | ![](screens-2026-11-16-pass4/popup-ask-answer-light.jpg) |
| ![](screens-2026-11-16-pass4/android/ask-parent-yes-dark.jpg) | ![](screens-2026-11-16-pass4/popup-ask-answer-dark.jpg) |

The asked video then plays on the live site: [light](screens-2026-11-16-pass4/inpage-ask-allowed-once-light.jpg), [dark](screens-2026-11-16-pass4/inpage-ask-allowed-once-dark.jpg).

### Live chat, a real stream

| Allow mode, one allowed word | Block list, one blocked word |
|---|---|
| ![](screens-2026-11-16-pass4/inpage-live-chat-allow-word-light.jpg) | ![](screens-2026-11-16-pass4/inpage-live-chat-blocked-word-light.jpg) |

Allow mode with "love": 1 of 79 messages showed, and the gift rows were hidden too. Block list with "the": the 2 messages that said it were hidden of 76. Every message's sender id was read (79 of 79). Dark: [allow](screens-2026-11-16-pass4/inpage-live-chat-allow-word-dark.jpg).

### Comments from X hidden · Undo

| Blocked from the comment's menu | After Undo |
|---|---|
| ![](screens-2026-11-16-pass4/inpage-comments-hidden-note-light.jpg) | ![](screens-2026-11-16-pass4/inpage-comments-undone-light.jpg) |

Undo removed the rule (1 channel, then 0) and the comment came back. Dark: [note](screens-2026-11-16-pass4/inpage-comments-hidden-note-dark.jpg), [undone](screens-2026-11-16-pass4/inpage-comments-undone-dark.jpg).

### Skip this video

| A pack video during study | Skipped | Held from then on |
|---|---|---|
| ![](screens-2026-11-16-pass4/inpage-study-skip-light.jpg) | ![](screens-2026-11-16-pass4/inpage-study-skipped-light.jpg) | ![](screens-2026-11-16-pass4/inpage-study-skipped-gate-light.jpg) |

Dark: [skip](screens-2026-11-16-pass4/inpage-study-skip-dark.jpg), [skipped](screens-2026-11-16-pass4/inpage-study-skipped-dark.jpg), [held](screens-2026-11-16-pass4/inpage-study-skipped-gate-dark.jpg).

### Kids site: a direct watch link during a Kids learning round

| Off the round's packs | On a pack |
|---|---|
| ![](screens-2026-11-16-pass4/inpage-kids-direct-watch-off-pack-light.jpg) | ![](screens-2026-11-16-pass4/inpage-kids-direct-watch-in-pack-light.jpg) |

The Kids site asks a parent to set it up before any watch page opens (["Get a parent to set up"](screens-2026-11-16-pass4/inpage-kids-site-parent-setup-light.jpg)); that gate was not passed by automation. So the watch document was a stand-in served at the real `youtubekids.com/watch` URL with the page's own player data, and everything else was real: the extension, its compiled Kids study rules (Ages 5-7 pack) and the network. Off-pack (Baby Shark): "Not part of today's study"; a pack channel (Numberblocks): plays. Before this pass the gate returned early on the Kids site. Dark: [off-pack](screens-2026-11-16-pass4/inpage-kids-direct-watch-off-pack-dark.jpg), [pack](screens-2026-11-16-pass4/inpage-kids-direct-watch-in-pack-dark.jpg).

## Found on the live site

- The compiler never read the "Allow once" passes: the store key had been added to another storage read, so an answered ask still showed the blocked card. Fixed and pinned by a test.
- The watch gate returned early on the Kids site. It now runs during a Kids learning round.
- "Skip this video" showed on a video the watch gate already held back. It no longer does.
- Gift rows in live chat stayed visible in allow mode. They are decided too (the app shows none).

## Not done

- Ask a parent: an ask from a blocked channel page, Study's "Ask for time" next to watch asks, and notifications (the extension has no notifications permission and this pass adds none).
- "Skip this video" is on the watch page; the app also offers it in a card's ⋮ menu.
- The remaining Partial rows in the audit: the channel row's node-mapping card, the search explainer in Study setup, a parent's lock sent during a child's own Self-Control session, and five Support variants on purpose.
