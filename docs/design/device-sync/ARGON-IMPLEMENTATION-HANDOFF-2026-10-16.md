# Argon owns device-sync UI implementation

User explicitly selected this FilterTube folder for Gemini and asks Argon to lead UI/UX and make actual code edits. Codex owns transport correctness, review, tests, and integration. Device sync first; profile changes are an audit backlog for later.

## Ownership for this pass

Argon may edit `html/tab-view.html`, `css/serene-shell.css`, create `js/family_device_hub.js` (if useful), and write `docs/design/device-sync/ARGON-IMPLEMENTATION-2026-10-16.md`. Codex freezes those files until Argon reports done. Preserve ALL existing dirty work. Do not reset, commit, build, publish, alter dependencies, inspect credentials, or edit any other paths. In particular `js/tab-view.js` and `js/nanah_managed_live_policy.js` are concurrently owned by Codex/subagents; read only. Keep changes limited to My Devices & Family / its Account & sync header.

## Goal and locked direction

Resumed chat review setting (user instruction, October 17): use Argon in chat mode with **Medium effort**. Wait for Argon availability rather than silently substituting Flash-Lite for its design review. This original handoff's test counts and in-progress findings are historical; current status is in `COMPLETION-AUDIT-2026-10-17.md` and `INSTALLED-ACCEPTANCE-2026-10-17.md`.

AirDrop/Xender simplicity: one calm device hub; select recipient, review rules source and fixed receiving profile, send. Existing warm neutral utility palette and tokens. Stable grid over quiet rings; no floating moving targets, no decorative hero, no pile of cards, no framework migration. Current extension uses plain HTML/CSS/JS plus Preact decorations. Mobile/tablet/TV-compatible navigation and generous readable focus targets. Actual Android/TV runtime remains a separate device gate.

Current root implementation already removed the duplicate hero, compacted the local hub, shortened tiles, hid inactive review, moved delivery/help into a collapsed disclosure, kept setup actions in a separate collapsed disclosure, and fixed hidden semantics. Your own review identified the remaining 3+3 competing entry points and focus handoff. Your final design chat `FilterTube UI Redesign` decided to remove the extra setup drawer and move the three existing hooks into pairing/intent controls, keeping them keyboard reachable.

## Implement an actual candidate

Inspect the current source, then directly implement your final UI design within owned files. Main hub should expose the minimum understandable Add/Receive/nearby controls. Keep own-device copy easy even when parent has protected profiles. New or saved verified devices must use actual runtime data; never add pretend devices or online/progress states. You may create a small platform-neutral UI helper for review focus/Escape or Add/Receive disclosure, but define a clean callback interface for Codex to wire into existing runtime. Do not duplicate transport/auth/sending logic. No new libraries. Record exact JS integration requirements and IDs in your implementation note.

Keep these existing hooks present exactly once: ftNanahQuickSyncDevicesBtn, ftNanahQuickCreateProtectedBtn, ftNanahQuickSendUpdateBtn; ftNanahFindNearbyBtn, ftNanahShowNearbyBtn, ftNanahAddDeviceBtn; ftNanahMapEyebrow, ftNanahMapTitle, ftNanahMapDetail; ftNanahTrustedDeviceStrip, ftNanahHomeBridgePresenceRow; ftNanahDeviceEmpty; ftNanahDeviceSelectionPreview, ftNanahDeviceSelectionActionBtn, ftNanahDeviceSourceBtn. Preserve all other controls, dialogs, profile/security sections and script ordering. If moving actions to a disclosure, use native details/summary and keep actionable buttons reachable. Never aria-hide focusable controls as a shortcut.

## Non-negotiable runtime boundaries

- Child profiles CANNOT change their protected settings; only their authorized parent can. Child hub offers receive, match phrase, view update status, check waiting updates. Never Send/review-source/edit rules.
- Browser LAN discovery needs optional helper on both computers and explicit temporary visibility. No zero-setup Wi-Fi enumeration. Search two minutes, visibility three. Only actual discovery pulses rings, reduced motion stillness.
- OTP is a short pairing code (currently four characters), QR fills a code; joining and matching the safety phrase remain explicit. Pairing can work across internet while both devices are open. Presence never grants trust.
- Saved trust does not mean device online. Receiver target profile/device stays fixed by verified link. Own-device one-time copy does not require protected child setup or PIN.
- A send or queued pickup is not Applied. Codex fixed current validated live acceptance/rejection receipt feedback. A mixed batch has per-scope applied/rejected/pending details. Tile should show one short state, with full detail only in selected-device review. No fake success or progress.
- One contextual review area. On deliberate tile activation, safe focus handoff to the review action; Escape returns to that selected tile. Background polling must never steal focus. Preserve existing `family_device_navigation.js` directional navigation/focus restoration.
- Honor reduced motion, keyboard, visible focus, mobile reflow, large touch/D-pad targets and long device/profile labels.

## Existing tests / current evidence

85 focused tests passed this pass, including new live receipt feedback tests, picker action cancellation/duplicate click/revoked trust/source mapping, QR, helper, navigation. Prior pass tested real two isolated extension contexts with personal and parent/child pairing, send/apply and receiver storage readback. Current visual check uses source-derived layout fixture with explicitly simulated devices, not transport proof. Physical computers/router/NAT, real camera, Android/TV and hosted offline pickup remain open.

## Profile audit context (review only, later fixes)

Default is master; independent adult/parent profiles are accounts; protected are child. Parent Edit Rules keeps parent active while editing named child scope; child PIN only switches into child and never grants admin. Local edits are saved locally; a separate reviewed send reaches the remote fixed child target.

Subagents found for audit/backlog: owning independent parent cannot rename/delete child despite enabled buttons; deleting an account leaves child parent IDs orphaned while UI resolves missing parent to Default; save-vs-send copy could be clearer. Current transport subagent is fixing a mutable local-source snapshot race while signing waits; it also found non-default remote parent profile IDs rejected by receiver's local-ID checks, under investigation. Do not change any of these profile/auth/transport paths.

## Skills used by Codex

Claude frontend: precise restrained direction, real working UI. Design taste: no card nesting/hero bloat, one accent, clear states, transform/opacity-only motion. UI/UX Superstack: preserve stack and one coherent direction; responsive design and accessibility first. User simplicity overrides ornamental motion or default React/Tailwind suggestions. Design review is advisory, not a reason to stop authorized implementation.

## Completion response

Write the implementation note, list files actually changed, exact runtime wiring needed, decisions rejected and why, and validation actually performed. Then stop editing your owned files so Codex can integrate/review. Do not call design-only source checks end-to-end sync proof.
