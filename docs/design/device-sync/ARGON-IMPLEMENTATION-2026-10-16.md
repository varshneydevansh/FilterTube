# Device picker integration — 16–17 October 2026

## Design and implementation ownership

Gemini app, Argon model, new FilterTube task with the owner-selected extension folder. Argon supplied the device-first layout direction and a concrete HTML/CSS/JavaScript proposal. Its direct file-tool attempts stalled without saved project UI changes. Codex stopped those attempts, requested a code-only handoff, and applied the reviewed proposal. Two Codex subagents reviewed interaction and transport/authority separately. FreeLLMAPI critique was advisory, with failed or truncated responses rejected.

## Applied decisions

- Saved and nearby device tiles are the main selection surface. Presence is not trust and saved does not mean online.
- Add with code or QR is first and primary. Receive nearby explicitly describes temporary opt-in visibility; Find nearby is secondary. Nearby needs the optional helper on both computers. Code/QR pairing remains available across the internet while both devices are open.
- The three older setup actions live inside Pairing details; no extra setup drawer competes with the picker. Advanced delivery and support details remain inside Connection options and help.
- One contextual review shows the selected recipient, local source, fixed remote receiving profile, route and detailed receipt outcome. Tiles have a short state; partial results never claim full application.
- Deliberate tile activation hands focus to its visible next action. Escape returns to the corresponding tile without hiding the useful review. Discovery rerenders preserve focus and never initiate review focus.
- Existing keyboard navigation owns focus behavior; no duplicate helper or framework migration. Controls wrap on narrow surfaces and retain large targets. Search rings animate only during bounded discovery, honor reduced motion and do not imply distance or trust.
- Child mode keeps Enter parent code, phrase verification and receive status. Rules selection and sending remain parent-only.

## Review corrections to Argon proposal

The queued focus handoff must yield to a modal or a newer user action. The Add control cannot disappear in child mode, because it is also the receive-code entry. Receive nearby is more precise than a generic Receive label for the helper-only visibility action. Shared navigation is reused instead of adding a second module.

## Validation boundary

Source-level behavior tests cover picker actions, focus preservation, QR validation, source snapshots, fresh parent authority, cross-installation parent IDs and delivery receipts. Browser packages are built separately. Earlier isolated installed-extension tests established personal copying and managed parent/child apply, but do not prove every latest UI change, real separate-computer LAN/NAT, camera behavior or downstream mobile/TV apps. Profile issues are tracked in PROFILE-AUDIT-2026-10-16.md; that audit is scoped, not exhaustive.

## Final local verification — 17 October

- 148 focused behavior/localization tests passed after the final runtime and interaction changes, including 12 navigation cases.
- English/catalog structure validation passed; this does not certify complete translated UI coverage.
- Chrome, Firefox and Opera archives built successfully. Final package rebuild includes the final control-target CSS adjustment.
- Source syntax checks and diff whitespace validation passed. Device control IDs are unique; all three legacy setup hooks are inside Pairing details.
- Broader archival audits still have historical failures reproduced from isolated HEAD: line-count fingerprints, obsolete extracted-block anchors and localized BlockTube copy. They were not relabeled as regressions from this work or rewritten to manufacture a green suite.
