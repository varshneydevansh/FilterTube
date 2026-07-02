# FilterTube Dashboard Help Bubble Surface

Date: 2026-07-02

## Scope

This documents the dashboard-wide help-bubble affordance added after parent
feedback that hover-only browser tooltips were too slow, too hidden, and not
usable on touch devices.

## Behavior

The tab dashboard now uses one delegated help-bubble manager in
`js/tab-view.js`.

It reads help text from:

```text
data-filtertube-help
title
data-filtertube-title
```

The manager applies to static and dynamically rendered controls because it is
delegated from `document`, not attached one row at a time.

Supported interactions:

```text
mouse hover       -> show immediately
keyboard focus   -> show immediately
remote/TV focus   -> same focus path
touch long-press  -> show after a short hold
Escape / blur / scroll / pointer leave -> hide
```

## Covered Surfaces

Any dashboard control with `title` or `data-filtertube-help` is covered,
including:

- keyword row pills such as Exact, Comment, and Date
- channel-management selectors and imported-list filters
- Settings import/export buttons and helper rows
- Account & Sync security and family-device controls
- Family Device Updates controls for Send Update, Home Pickup, Internet Pickup,
  pairing, safety phrase confirmation, More options, trusted devices, and
  mode-specific actions
- Content Controls toggle rows that already carry explanatory text

2026-07-02 follow-up: the first delegated pass exposed the helper only where
existing elements already had `title` or `data-filtertube-help`. The Nanah
Profile Update surface had several plain labels and dynamic button labels, so
the parent-facing explanations did not appear on important controls such as
Family control, Protected device, Pair Protected Device, Send Protected Update,
Save Parent Trust, Meeting service link, and Trusted devices. The follow-up adds
explicit help copy to those static controls and updates the dynamic mode labels
from `js/tab-view.js` whenever the user switches between Copy once, Family
control, Move account, or receive-only protected mode.

## Parent-Facing Intent

The affordance is intentionally not limited to developer docs. Parents should be
able to pause on a control and understand what it does before changing a
setting.

Short clicks still perform the original action. Long-press is only for help.

## Boundaries

- The popup remains compact and may not expose every long-form explanation.
- Controls without `title` or `data-filtertube-help` do not get a bubble until
their copy is added.
- This does not change filtering behavior, sync behavior, or profile authority.
