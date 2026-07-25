# Hide YouTube Playables control proof

Date: 2026-07-25

Status: implemented with focused automated proof; live YouTube smoke remains
required before an installed-extension parity claim.

## Captured surface

The supplied mobile YouTube capture contains:

- an outer `ytm-rich-section-renderer`;
- a nested `ytm-rich-shelf-renderer`;
- `mini-game-card-view-model` game cards; and
- shelf and card links whose paths begin with `/playables`.

The visible `YouTube Playables` heading is not used as runtime authority because
it can be localized. The route and renderer identities are the stable evidence
used by this change.

## Contract

`hidePlayables` is a first-class boolean content control:

- it appears in the Feeds group as `Hide YouTube Playables`;
- it defaults to `false`;
- profile compilation, root compatibility storage, import/export, background
  refresh, and content refresh owners carry it; and
- when enabled, the DOM style owner hides desktop/mobile Playables shelves,
  Playables navigation entries, and known game card view models.

Disabling the setting regenerates the shared content-control stylesheet without
the Playables selectors, restoring YouTube's normal rendering.

## Automated proof

Run:

```text
node --test tests/runtime/hide-playables-control-current-behavior.test.mjs
```

The fixture proves:

- catalog title, key, description, and Feeds placement;
- disabled mode emits no Playables selectors;
- enabled mode emits route-based desktop and mobile shelf selectors;
- enabled mode includes `mini-game-card-view-model`;
- selector behavior does not depend on the English shelf heading; and
- compiled settings plus persistence/refresh owners carry `hidePlayables`.

## Boundaries

This proof does not claim current installed Chrome/Firefox/Opera behavior or a
live YouTube SPA smoke. Those remain manual release evidence. Historical
`*-current-behavior` audit files contain stale whole-file fingerprints from
other work in the current tree; they are not rewritten as part of this focused
feature slice.
