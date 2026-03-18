# Watch SPA Collaborator + Mix Menu Recovery

Date: 2026-03-18  
Updated: 2026-03-19

## Scope

This note captures the watch-page SPA fixes around:

- collaborator recovery in 3-dot menus
- watch-page playlist / Mix row identity recovery
- the custom fallback 3-dot menu path
- quick-block vs menu-block behavior differences
- known YouTube music / VEVO / topic-channel caveats

This is the shortest “what broke, why, what we fixed, and what not to break again” reference for future work.

## Main Symptoms We Saw

### 1. Watch-page SPA collaborator rows only showed a partial roster

Example:

- Video: `41ZY18JqI2A`
- Visible row text: `Shakira and 2 more`

What happened:

- the row seeded a partial collaboration state
- the menu often knew only one collaborator initially
- the main-world enrichment was supposed to upgrade that to the full roster
- instead the enrichment path either crashed or returned incomplete data
- initial preload/byline text like `Shakira and 2 more` was only a collapsed hint, not the authoritative roster

Observed desired roster:

- `Shakira`
- `Spotify`
- `Beéle`

### 2. Custom fallback 3-dot menu on watch-page Mix / playlist-like rows did nothing

Example:

- watch-page Mix / playlist row for Pitbull-related content

What happened:

- quick-cross block worked
- the custom fallback 3-dot menu said `Block Channel`
- clicking it did nothing on some rows

The key log was:

- `FilterTube: Fallback menu could not extract channel identity`

### 3. Music-channel identity was sometimes YouTube-side messy

Examples:

- Pitbull content surfacing through `@Pitbull` vs `@PitbullVEVO`
- Shakira / `shakiraVEVO` style collaborator identity mixtures

This is not fully a FilterTube bug. YouTube sometimes mixes:

- artist display name
- VEVO handle
- VEVO UC ID
- artist UC ID

in the same surface.

Issue reference:

- [issue #25](https://github.com/varshneydevansh/FilterTube/issues/25)

### 4. Some fallback 3-dot blocks stored the row title as the channel name

Example:

- `NYUSHA / НЮША – «Целуй» (Премьера клипа 2016)`

What happened:

- the fallback 3-dot block could add the correct UC ID
- but the display name came from weak row metadata
- later enrichment fetched the real channel page name
- the existing merge rules still kept the earlier title-like label

That made some Mix/watch blocks look correct in identity terms but wrong in the stored channel list UI.

### 5. `Filter All` semantics were inconsistent on the custom fallback path

What happened:

- the fallback 3-dot popover correctly showed `Filter All`
- but clicking the toggle could behave like the block action itself

That is the wrong interaction model. `Filter All` is a selection that changes the block payload. The actual block action is clicking the `Block • Channel` row.

## Root Causes

### A. Collaborator enrichment had drifted away from the authoritative watch-page path

The documented collaborator roster for watch-page SPA is in:

- [json_paths_encyclopedia.md](/Users/devanshvarshney/FilterTube/docs/json_paths_encyclopedia.md)

Important path:

- `showSheetCommand -> panelLoadingStrategy -> inlineContent -> sheetViewModel -> content -> listViewModel -> listItems`

That path is the real collaborator sheet for watch-page collab rows.

Earlier regressions had removed or weakened:

- this `sheetViewModel` path
- watch-specific fallback roots like selected playlist/watch rows
- safe merge behavior for partial collaborator seeds

### B. The main-world collaborator merge path had a runtime bug

There was a real merge-time error in:

- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)

Symptom:

- `ReferenceError: isHandleLike is not defined`

That meant:

- the full collaborator roster could arrive
- but merging it into the DOM-derived partial state could still fail

There was also a stricter runtime break during one regression window:

- `searchYtInitialDataForCollaborators()` could throw on an undeclared `result` variable in strict mode
- that caused collaborator requests to time out and left the menu stuck on placeholders

### C. The fallback 3-dot menu and quick-cross used different recovery strength

Quick-cross already had a more resilient final fallback:

- if no stable identity exists on the row, use `watch:VIDEO_ID`
- let background recover the real owner from the watch page

The custom fallback 3-dot popover did **not** do that initially.

It used:

- row extraction
- then one main-world lookup
- then it stopped if still unresolved

That is why quick-cross could work while the 3-dot menu appeared dead.

### D. Mix rows are not normal channel rows

Mix rows are playlist-like objects first, not author cards.

From the encyclopedia:

- Mix identity is often shaped around `playlistId`
- byline text is not reliable owner identity

So future fixes must avoid treating Mix seed text as authoritative channel identity unless there is a stronger recovered owner path.

## Fixes Landed

### 1. Restored watch-page collaborator recovery

Main points:

- restored support for the documented `sheetViewModel` collaborator path
- restored watch-page fallback candidates like watch metadata / selected playlist rows
- improved candidate ranking so the extractor prefers real collaborator rosters instead of shallow matches

Relevant files:

- [injector.js](/Users/devanshvarshney/FilterTube/js/injector.js)
- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)

### 2. Fixed collaborator merge-time crash / degradation

Main points:

- added local helper guards for collaborator merge
- stopped weak names from overwriting better collaborator names
- kept incomplete collab state marked as needing enrichment instead of pretending it was done

Relevant area:

- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)

### 3. Fixed the fallback 3-dot watch/Mix block path

Main points:

- fallback menu now prefers `UC ID` first, then custom URL, then handle
- if the row still has no stable identity, it now uses:
  - `watch:VIDEO_ID`
- background can then recover the authoritative owner from the watch page

This makes the fallback 3-dot path behave like quick-cross in the cases where row identity is weak.

Relevant area:

- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)

### 4. Tightened Mix handling without reopening the earlier regression

Main points:

- obvious collaboration rows like `Shakira and 2 more` should not be finalized by the Mix shortcut
- true Mix rows are still kept separate from collaboration logic

This keeps the collab fix narrow and avoids broadening Mix behavior recklessly.

### 5. Added UI feedback for the custom fallback 3-dot button

The custom fallback 3-dot button originally had:

- hover styling only

It now has:

- focus-visible feedback
- pressed feedback
- open-state feedback using `aria-expanded="true"`
- toggle-click guarding so `Filter All` does not fire the row action

This makes the fallback 3-dot control feel less dead compared with native YouTube buttons.

### 6. Repaired fallback-menu names when later enrichment is better

Main points:

- fallback 3-dot adds can start from weak row metadata
- post-block enrichment now gets a chance to replace a title-like stored name with the stronger fetched channel-page name for the same UC ID
- this keeps the stored blocked-channel list aligned with the real owner identity after recovery completes

Relevant area:

- [background.js](/Users/devanshvarshney/FilterTube/js/background.js)

### 7. Synced `Filter All` from 3-dot UI into the keyword list

Main points:

- the dashboard / extension UI path already knew how to create channel-derived keyword entries when `Filter All` is enabled
- the 3-dot add path was passing `filterAll` into the channel block entry but was not mirroring that into stored keyword state
- background now synchronizes channel-derived keywords for `Filter All` when the user blocks through the 3-dot path too

Relevant area:

- [background.js](/Users/devanshvarshney/FilterTube/js/background.js)

### 8. Split selection from action inside the custom fallback popover

Main points:

- `Filter All` toggle is now selection-only
- the fallback row ignores toggle-originated clicks / keyboard events
- only activating the actual `Block • Channel` row counts as the block action
- the block row also gets a short pressed pulse before closing so the click is visible

Relevant area:

- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)

## Concrete Examples

### Example 1: `41ZY18JqI2A`

Before:

- row seeded as `Shakira and 2 more`
- menu frequently held partial collaborator state
- enrichment was unstable or crashed

Now:

- main-world collaborator extraction returns the full roster
- merge path accepts and preserves the richer identity

Expected collaborators:

- `Shakira`
- `Spotify`
- `Beéle`

### Example 2: `hHUbLv4ThOo`

Observed pattern:

- initial row identity weak / incomplete
- direct channel lookup could fail
- watch-page fallback recovered owner identity from `videoOwnerRenderer`
- block succeeded using the recovered UC ID

This is the model the fallback 3-dot path now follows too.

### Example 3: `o0PpP0ksmcI`

Observed pattern:

- watch-page recovery resolved:
  - `UCv8nzwVPQDRjkPCkEsOdEwA`
  - `@Pitbull`
- block then persisted correctly

## Quick-Block vs 3-Dot Menu

### Quick-cross

Strengths:

- can fall back to `watch:VIDEO_ID`
- background resolves the owner from watch-page fetch logic

Weakness:

- starts from weaker raw card state
- does not benefit from the same dropdown prefetch model as the real 3-dot menu

### Normal / fallback 3-dot menu

Strengths:

- better menu-specific identity handling
- can benefit from prefetched or enriched state

Earlier weakness:

- custom fallback popover stopped too early when row identity was weak

Current state:

- fallback 3-dot now has the same last-resort watch-page recovery model as quick-cross

## Known Caveats

These are still real:

- VEVO vs artist-handle mismatches
- music-topic / main-artist / VEVO identity drift
- Mix rows being playlist-like rather than true owner rows
- YouTube serving related music content from alternate channel IDs even when a user expects a single artist identity

Do not overfit one music example into a global identity rewrite without checking the YouTube-side payload first.

## Guardrails For Future Work

- Never lose `videoId` on watch-page SPA rows. That is the key for strong recovery.
- Never trust recycled DOM row identity without revalidation.
- Do not let Mix title/byline text become canonical channel identity.
- Do not degrade `expectedCollaboratorCount > 1` collab rows into single-channel state too early.
- Keep old/new 3-dot menu paths behaviorally aligned.
- Keep the fallback 3-dot menu row-scoped and `videoId`-scoped.
- Prefer `UC ID` over handle when both exist.
- Keep `Filter All` side-effect free until the user activates the real block row.
- Allow post-block enrichment to repair weak title-like names for the same canonical UC ID.
- Treat music / VEVO / topic-channel identity as a known messy domain, not a solved one.

## Best Files To Reopen First

- [content_bridge.js](/Users/devanshvarshney/FilterTube/js/content_bridge.js)
- [injector.js](/Users/devanshvarshney/FilterTube/js/injector.js)
- [json_paths_encyclopedia.md](/Users/devanshvarshney/FilterTube/docs/json_paths_encyclopedia.md)
- [WATCH_PLAYLIST_BREAKDOWN.md](/Users/devanshvarshney/FilterTube/docs/WATCH_PLAYLIST_BREAKDOWN.md)
- [collab_three_dot_ui_google_aistudio.md](/Users/devanshvarshney/FilterTube/docs/collab_three_dot_ui_google_aistudio.md)
- [colab_spa.JSON](/Users/devanshvarshney/FilterTube/colab_spa.JSON)
- [stash.txt](/Users/devanshvarshney/FilterTube/stash.txt)
- [reset37.txt](/Users/devanshvarshney/FilterTube/reset37.txt)

## Short Summary

The important recovery model now is:

1. Use row identity when it is strong.
2. Use main-world collaborator/watch extraction when row identity is partial.
3. Prefer UC IDs.
4. If a watch-page row still has no stable identity, allow `watch:VIDEO_ID` recovery.
5. Keep Mix logic narrow so it does not swallow real collaborator rows or invent fake owner identity.
6. Treat `Filter All` as selection state only, then mirror it into channel-derived keyword storage when the block is confirmed.
