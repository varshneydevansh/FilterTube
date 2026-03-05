# Watch Page JSON Paths (`get_watch`)

This document explores the JSON paths primarily encountered on the `/youtubei/v1/next` (Up Next / Watch Page) and `/youtubei/v1/player` endpoints, particularly focusing on how to extract collaborator channel IDs, playlist cards, and right rail recommendations. 

---

## 1. Main Video & Collaborator Context (`videoSecondaryInfoRenderer`)
*Found in the `next` response, this renderer holds the current video's owner/collaborator information.*

**Base Path to Item**: `...videoSecondaryInfoRenderer.owner.videoOwnerRenderer`

**Collaborator / Multi-Owner Identification:**
If a video has collaborators, the `attributedTitle` will reflect a combined string, and the `avatarStack` or `navigationEndpoint.showDialogCommand` contains the actual channels.

- **Combined Byline Name**: `...attributedTitle.content` -> Value: `"Shakira and 2 more"`
- **Collaborators Dialog Trigger (List of channels)**: `...navigationEndpoint.showDialogCommand.panelLoadingStrategy.inlineContent.dialogViewModel.customContent.listViewModel.listItems[]`

**For each `listItem` in the Collaborators List:**
- **Collaborator Channel Name**: `...listItemViewModel.title.content` -> Value: `"Shakira"`
- **Collaborator Channel ID**: `...listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.browseId` -> Value: `"UCYLNGLIzMhRTi6ZOLjAPSmw"`
- **Collaborator Handle**: `...listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl` -> Value: `"/@shakiraVEVO"`
- **Collaborator Avatar**: `...listItemViewModel.leadingAccessory.avatarViewModel.image.sources[0].url`

*(Note: Subscribe button state and endpoints are also stored under `...listItemViewModel.trailingButtons.buttons[0].subscribeButtonViewModel`)*

---

## 2. Right Rail Suggestions (`compactVideoRenderer`)
*Found in the `next` response's continuation items, representing standard video recommendations on the side.*

**Base Path to Item**: `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].compactVideoRenderer`

**Video Identifiers:**
- **Video ID**: `...videoId`
- **Title**: `...title.simpleText` 
- **Duration**: `...lengthText.simpleText` or `...lengthText.accessibility.accessibilityData.label`

**Channel Details:**
- **Uploader Name**: `...shortBylineText.runs[0].text`
- **Channel ID (Primary URL)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Channel Canonical URL**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Channel ID (Fallback, Avatar)**: `...channelThumbnail.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId`

---

## 3. Playlist Cards (`playlistPanelVideoRenderer`)
*When watching a video in a mix or playlist context, the player's inner list contains these items.*

**Base Path to Item**: `...playlistPanelVideoRenderer`

**Video Identifiers:**
- **Video ID**: `...videoId`
- **Playlist ID**: `...navigationEndpoint.watchEndpoint.playlistId`
- **Title**: `...title.simpleText` 

**Channel Details:**
- **Uploader Name**: `...shortBylineText.runs[0].text`
- **Channel ID**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Channel Canonical URL (Handle)**: `...shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl`
- **Alternate Uploader Name (Long)**: `...longBylineText.runs[0].text`

---

## 4. Shorts (`reelItemRenderer` / `shortsLockupViewModel`)
Due to newer UI updates, shorts in the right-rail or shelf often use `reelItemRenderer` or `shortsLockupViewModel`. It usually contains:
- **Video ID**: `...videoId`
- **Title**: `...headline.simpleText`
- **Channel Details**: Usually lacks detailed channel info, requiring fallback to `customContent` or URL parsing if present.

## 5. `get_watch?prettyPrint=false` coverage and fallback behavior

### Coverage notes

- `get_watch?prettyPrint=false` responses typically still include a stable `videoDetails` payload and often include owner metadata under:
  - `videoSecondaryInfoRenderer.owner.videoOwnerRenderer`
  - `videoDetails.author`, `videoDetails.channelId`, and related `microformat` fields when present.
- For playlist/mix card reuse in watch and YTM surfaces, the response often has enough signal to recover owner identity even when DOM attributes are weak.
- Critical shape note: roster/list identities are inconsistent across API variants and the same video can emit different nesting on repeated requests.
  - Most common reliable list path observed: `...shortBylineText.runs[0].navigationEndpoint.showDialogCommand.panelLoadingStrategy.inlineContent.dialogViewModel.customContent.listViewModel.listItems`
  - Alternate observed path in some responses: `...shortBylineText.runs[0].navigationEndpoint.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems`
  - We also observe `...showDialogCommand.dialog.presenterDialogViewModel...` and mixed `.dialogViewModel` payloads in watch/card surfaces.
  - For these responses, treat `shortBylineText`/`ownerText` names as aggregate UI text unless corroborated by explicit roster item entries (i.e., listItem entries with browseEndpoint or canonicalBaseUrl handle).

### Collaborator IDs can be missing in mix/watch views

- Some surfaces provide collaborator strings like `"Shakira and 2 more"` without reliable per-collaborator IDs in the byline text.
- In these cases, extractor logic should continue with:
  - `channelId` / ID from map and resolved payload fields first.
  - canonical `expected` hints (owner intent, expected byline/owner-name).
  - rendered channel name only when it is not clearly a list aggregate.
  - `handle` fallback only when no richer name is available.
- If only plain text collaborators are available and no ID-backed identity exists, do **not** mint a hard channel id from text; prefer safer fallbacks and avoid blocking wrong targets.

### Shape limits for `get_watch?prettyPrint=false`

- YouTube currently alternates collaborator roster layout across responses:
  - some use `showDialogCommand` → `panelLoadingStrategy.inlineContent.dialogViewModel.customContent.listViewModel.listItems`,
  - some move the same payload under `showSheetCommand`,
  - some nest `presenterDialogViewModel` inside `dialog`/`showDialogCommand`.
  - some nest payloads under `showDialogCommand.dialog.presenterDialogViewModel` and then `listViewModel` variants.
- `get_watch` can also omit `browseId` for some secondary collaborator items even when the roster title/byline exists.
  Treat those as **partial payloads**; do not overwrite richer card identity with collapsed aggregate names.

- JSON-only fallback contract for no-name/no-id cards:
  - If a card has no validated `UC...` identity or no safe channel name, we should re-run the JSON-based identity enrichment path before finalizing menu label text.
  - Do **not** synthesize hard IDs from `@handle` text when IDs are absent and no ID-backed candidate exists.
  - `@handle` and `customUrl` are still allowed as temporary display fallback only when there is no richer name.
- Menu label fallback must therefore stay strict:
  - strict id write only with `^UC[a-zA-Z0-9_-]{22}$`,
  - prefer cache/expected/DOM names before `@handle`,
  - `customUrl` before `video id`,
  - and `"Block Channel"` only when richer fields cannot be resolved.

### Fallback mode and ID safety

- Keep strict ID stamping for menu/card writes: only write `data-filtertube-channel-id` when value matches `^UC[a-zA-Z0-9_-]{22}$`.
- For label rendering:
  - prefer cache/identity-derived names and expected-owner names,
  - then DOM-extracted names,
  - then handle fallback only when no richer name exists,
  - then customUrl fallback, then strict ID fallback,
  - and only render `"Block Channel"` when no safer identity text is available.
- Never treat `"Unknown"` as a final display name when richer fields are present or partial identity was already recorded.
