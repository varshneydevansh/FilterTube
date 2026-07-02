# Audit: Parent-First Help And Control Surface Simplification

**Generated**: 2026-07-02
**Status**: Parent-facing dashboard copy and Help surface updated.
**Runtime behavior changed**: minimal UI/accessibility copy only.
**Goal slice**: Make FilterTube easier for parents and everyday users before
release while preserving the managed-control, sync, import, and filtering
contracts.

## Trigger

Parent feedback said FilterTube works, but the dashboard, website, and docs can
feel too technical. The most concrete confusion was the `Exact` keyword toggle:
parents need to know whether a word like `poop` also catches `poops` or
`pooping`.

## Parent-First Rule

Primary UI must answer the parent's next question first:

```text
What do I want to control?
Where do I click?
What happens to my child/protected profile?
What can be skipped for now?
```

Protocol, transport, provider, JSON, backup, and authority details stay
available, but they should not be the first thing a new parent has to parse.

## Control Surface Assessment

| Surface | Parent question | Current simplification |
| --- | --- | --- |
| Dashboard | What is happening today? | Kept as the summary/control center; no runtime changes in this slice. |
| Filters | How do I block words/channels? | Help now points parents to Filters first and explains `Exact` with concrete examples. |
| Keywords | Should Exact be on? | Shared keyword toggle now exposes hover/accessible help that says broad vs whole-word behavior for the actual keyword. |
| Kids Mode | Are Kids rules separate? | Help page map says Kids Mode manages YouTube Kids rules separately. |
| Settings | Is this where rules or backups live? | Hero copy now says Settings is for full backups, safe rule-list imports, and backup settings. |
| Rule list imports | How do I import lists safely? | Existing approved modal kept unchanged; Help states imported files only add channel/keyword rules and do not choose profiles, PINs, trust, viewing spaces, or time limits. |
| Accounts & Sync | How do I control another profile/device? | Hero copy now says create protected profiles, choose Main/Kids access, set daily time, and update a verified device without giving away the parent PIN. |
| Family Device Updates | How do I send changes? | Copy now says most families only need two steps: create a protected profile, then use Send Update while both devices are open. Pickup paths are optional and advanced. |
| Help | Where do I start? | Added parent quick start, common parent questions, and page map before the technical explanation. |

## Exact Keyword Behavior Now Explained

```text
Exact off:
  broader matching; "poop" can catch "poops" or "pooping" when YouTube exposes
  that text to FilterTube.

Exact on:
  stricter whole-word matching; "poop" must appear as its own word.
```

The text is now present in:

- Help quick-start card.
- Help common parent questions.
- Help Filters section.
- Shared keyword toggle title/accessibility label in the renderer.

## Device Sync Wording Boundary

Parent-facing default:

```text
Open both devices -> pair -> verify phrase -> Send Update.
```

Advanced-only paths:

```text
Home Pickup:
  optional configured home/school/clinic pickup service for verified devices.

Internet Pickup:
  optional trusted online pickup service for verified devices that open later or
  away from the parent device.
```

These names are still visible where the user configures advanced delivery, but
the first-run copy now says most families can skip them.

## What Did Not Change

- No filtering, whitelist, blocklist, JSON, DOM fallback, menu, or sync authority
  behavior changed.
- The approved Rule List Import modal was not redesigned in this slice.
- No public claim was added for hosted FilterTube pickup service, automatic LAN
  discovery, or native Android/iOS parity.

## 2026-07-02 Second Pass

Parent feedback and local UI review showed two remaining problems:

1. Help still exposed too much protocol language before explaining the parent
   workflow.
2. The Dashboard display typography used tight line-height and negative
   tracking that made hero/app text harder to read.

Changes made:

- Added parent-facing questions near the top of Help for time limits,
  protected-profile tamper boundaries, other-device updates, and rule-list
  import targets.
- Added a plain-language Family Controls card before the detailed device-sync
  explanation.
- Moved the long device-update/protocol explanation into an `Advanced`
  disclosure and then opened optional/advanced Help sections by default after
  local review showed parents still need to see the available topics without
  hunting through collapsed cards.
- Changed Help card layout so optional/advanced sections span the page and use
  natural height, reducing the awkward empty grid space caused by mixed-height
  cards.
- Added a parent-managed editing explainer for the most confusing flow:
  parents can virtually edit a protected profile from the parent device, the
  child profile PIN is not parent authority, and the verified child device can
  receive the signed update through live Send Update or later Pickup.
- Clarified the two-PIN model in parent-facing Help: parent/account or Master
  unlock is the control PIN, while the child/protected profile PIN is only a
  switching guard so siblings or any other user cannot casually open that
  profile.
- Updated Accounts & Sync trusted-device copy to match current Pickup behavior:
  saved links are not a live connection, but Pickup can let a verified protected
  device collect a signed parent update when it opens later.
- Simplified Dashboard headline/app copy and relaxed heading letter-spacing and
  line-height for readability.

Runtime boundary:

```text
UI/copy/CSS only.
No authority, storage, sync validation, policy apply, filtering, or YouTube DOM
runtime behavior changed.
```

## Remaining UX Work

```text
1. Website needs the same parent-first quick-start language.
2. Per-control tooltip audit is still needed for every Settings and Accounts &
   Sync button.
3. Installed-extension screenshot pass should verify the Help page on narrow and
   wide windows.
4. Future advanced delivery labels can be softened further, but implementation
   docs should keep exact transport names for auditability.
```
