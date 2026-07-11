# YTM camelCase Search collaborator warmup

Status: IMPLEMENTED_WITH_FOCUSED_AUTOMATED_PROOF; installed-extension smoke pending.

## Captured regression

- Video: `_Wcf2rKEB8E` (`Shakira - La Pared (Anniversary Version)`).
- Current YTM Search DOM exposes one card-level channel link plus the camelCase byline `.YtmBadgeAndBylineRendererItemByline .ytAttributedStringHost` with `Shakira and Spotify`.
- The retained `/youtubei/v1/search` response exposes a header-backed `Collaborators` sheet with `shakiraVEVO` and `Spotify`.
- The adjacent generated Mix is `RD_Wcf2rKEB8E` with descriptive byline `Shakira, KAROL G, and more`; it contains no collaborator roster.

## Root cause

`hasCollaboratorWarmupSignal()` could be taught to notice the camelCase byline, but `prefetchCollaboratorsForCard()` still returned before requesting Main World because the DOM intentionally did not promote a bare `A and B` label into a collaborator roster. Detection alone therefore did not reach the already-captured XHR sheet.

## Implemented invariant

- A non-Mix `ytm-video-with-context-renderer` with a plain `A and B`/`A & B` byline may use those names only as lookup hints for its exact `videoId`.
- That lookup sets `requireCollaboratorsSheet`; a matching fallback list, avatar stack, or DOM-derived list cannot satisfy it.
- Injector candidate and cache provenance preserve `collaborators-sheet`, and a sheet roster outranks a non-sheet cache entry.
- Only the resolved sheet roster is applied to cards. The provisional byline names are never stamped as collaborator identity.
- MIX renderers remain excluded before lookup and cannot be split into collaborator rows.

## Behavior ledger

| Surface | Before | After |
|---|---|---|
| YTM Search collaboration card | Warmup queued, then returned before XHR lookup | Exact video lookup reaches retained Search JSON and applies the sheet roster |
| Plain channel name containing `and` | Not promoted | Still not promoted; a sheet is mandatory for this new lookup path |
| Generated MIX | Excluded | Still excluded; no collaborator request or row splitting |
| Existing header-backed roster lookup | Supported | Preserved; sheet provenance now survives sanitization/cache arbitration |

## Automated proof

- `node --check js/content_bridge.js`
- `node --check js/injector.js`
- `node --test --test-reporter=spec tests/runtime/ytm-camelcase-search-collaborator-warmup-current-behavior.test.mjs` — 5/5 pass.
- Focused existing collaborator tests — 8/8 pass, including sheet extraction, snapshot lookup, Topic-name rejection, and MIX exclusion.
- `npm run build:chrome` — pass.

Installed-extension verification remains required for the exact Search card before release completion.
