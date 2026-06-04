# FilterTube Feature Source Dependency Register - Current Behavior - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This register records what each major feature currently depends on before it
can hide, show, mutate, fetch, count, or publish a claim. It fills the gap
between the feature risk matrix and the identity waterfall: a feature is not
safe to optimize just because one authority family is documented. It must also
prove its rule state, content text, identity, selector/lifecycle, and side
effects for the exact route and settings mode being changed.

## Dependency Columns

| Column | Meaning |
| --- | --- |
| Rule-state source | Where the feature decides whether it is active: background compiler, shared UI compiler, StateManager, list mode, profile state, legacy aliases, native/app payload, or static claim data. |
| Content/text source | Where titles, descriptions, comments, post body, category, duration, date, or route metadata come from. |
| Identity source | Where channel, handle, UC id, custom URL, video id, collaborator, Kids owner, learned map, or fallback fetch identity comes from. |
| DOM/lifecycle source | Which selectors, observers, listeners, timers, page patches, or injected scripts are involved. |
| Side effects | What can happen beyond a pure decision: JSON mutation, DOM hide, pending hide, map write, storage write, backup, stats, media pause, click, fetch, tab open, native sync, release publication. |
| Current dependency risk | Why this feature is still not implementation-ready. |
| Proof gate | The stronger evidence required before behavior changes. |

## Feature Dependency Matrix

| Feature / workflow | Rule-state source | Content/text source | Identity source | DOM/lifecycle source | Side effects | Current dependency risk | Proof gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Empty install / disabled / no-rule runtime | `js/background.js` compiled settings, `js/settings_shared.js`, `js/seed.js` missing-settings gates, stale `blockedKeywords` / `blockedChannels` aliases | YouTubei response bodies can still be cloned, parsed, stringified, or harvested | Identity harvest can still write `channelMap`, `videoChannelMap`, or `videoMetaMap` in some paths | Fetch/XHR page patches in `js/seed.js`; DOM fallback, quick-block, fallback menu lifecycle setup | Parse, rewrite, observer/listener/timer work, map writes, forced DOM fallback | Empty UI is not currently zero work; disabled filtering still can do body work before pass-through | `compiledRuleState` plus endpoint/lifecycle counters proving zero parse, rewrite, scan, quick/menu sweep, map write, storage write, and fetch in disabled/empty states |
| Blocklist keyword filtering | Background compiler and shared settings rows; exact/comment/category options | JSON renderer text in `js/filter_logic.js`; DOM normalized text in `js/content/dom_fallback.js`; serialized comment keyword data | Usually no channel identity required, but channel-derived keyword/comment metadata can affect scope | JSON rules, DOM card selectors, comment DOM/JSON owners | JSON removal, DOM hide, stats/time-saved, media side effects for watch/player paths | JSON and DOM keyword matching differ; substring/exact/comment behavior can false-hide nonmatching text | Per-route keyword fixtures with matching and nonmatching siblings visible, exact/substr/comment scope, JSON/DOM parity, restore, and stats proof |
| Blocklist channel filtering | Background compiled channel lists, V3/V4 aliases, Main/Kids list mode | Renderer byline/title may be used for context but channel decision depends on identity | UC id, handle, custom URL, name-only fallback, learned maps, collaborators, DOM, watch/Shorts/Kids/channel background resolvers | DOM extraction, menu snapshots, learned-map broadcasts, fallback resolver reruns | Hide, map write, background fetch, storage cache patch, menu label/action mutation | Sources do not emit one confidence object; display-only names and stale maps can false-hide or miss blocks | `channelMatchResult` fixture across UC, handle, custom URL, learned map, stale map, display-only name, collaborator, no identity, and fallback fetch |
| Whitelist mode and pending hides | `listMode`, whitelist arrays, Kids/Main sync, profile type, visible rows versus aliases | Same JSON/DOM content surfaces as blocklist, but missing identity changes fail-closed behavior | Exact allow identity, learned maps, pending prefetch, video-id joins, fallback resolvers | Pending whitelist scheduler in `js/content_bridge.js`; DOM fallback pending markers; watch rail whitelist observer | Pending hide, inline display writes, identity prefetch, later restore or permanent hide, stats drift risk | Unresolved identity can hide before proof; empty whitelist is intentionally fail-closed but not fully product-gated | Empty whitelist product fixture plus resolved/unresolved/stale/Shorts/playlist/watch-rail/search/home allowlist fixtures with pending outcome and restore proof |
| Simultaneous allow/block future workflow | Not implemented; current V4 remains either/or through list mode, transfer, import, and alias paths | Would reuse keyword/channel/content sources | Would require both block and allow identity confidence in one decision record | Would touch UI rows, quick-block, 3-dot menu, JSON engine, DOM fallback, import/Nanah | Migration, storage writes, cache invalidation, backup, runtime refresh | Existing writers move or merge lists during mode transitions; stale aliases can override visible rows | Migration contract before implementation: per-entry action, legacy import, copy/transfer false, Kids/Main sync, quick/menu defaults, and rollback proof |
| Content/category/date/duration controls | Content/category UI settings, raw enabled flags, background compiler, DOM fallback predicates | Renderer categories, duration text, published time/date, metadata fetches, route metadata | Usually video id for metadata fetch; may use learned `videoMetaMap` | JSON renderer predicates and DOM card scanning; upload-date metadata scheduling | JSON removal, DOM hide, metadata fetch, storage/map update, stats | Raw enabled flags can wake work with empty/blank predicates; zero duration threshold can become broad hide | `compiledRuleState` predicate proof for enabled-empty, blank date, zero duration, valid broad predicate, route scope, and metadata-fetch reason |
| Comments filtering | Comment settings from compiler and UI; hide-all/comment keyword/global keyword paths | `commentRenderer`, `commentThreadRenderer`, `commentViewModel`, DOM comments, continuation payloads | Comment author channel id/handle when available; display name otherwise | `/next` comment continuations, JSON renderer rules, DOM fallback comment selectors | JSON removal, DOM hide, continuation mutation, stats | Append and reload continuation shapes differ; serialized comment regex reconstruction can drift | Comment fixture set for hide-all, comment-only keyword, global keyword, author channel, append/reload/replace continuation, and comments header visibility |
| Watch/player/current-video controls | Watch/player settings, route controls, profile/list mode, compiled payload | `/next`, `/player`, current watch owner row, player metadata, end-screen renderer data | `ytInitialPlayerResponse`, `/player`, `/next`, `videoChannelMap`, watch resolver, owner row display text | Watch page DOM fallback, player selectors, fullscreen/native paths, current-watch owner enforcement | Player response rewrite, metadata harvest, current video hide, pause, synthetic click next/playlist, stats | Watch URL/DOM can be video-id-only or stale during SPA transitions; side effects affect playback | Watch/player authority fixture for metadata-only `/player`, current owner identity confidence, end-screen DOM, playlist selected row, fullscreen/native pause, and no unintended media side effects |
| End-screen and watch recommendations | Keyword/channel/content settings and endpoint policy | `endScreenVideoRenderer`, watch-card renderers, compact autoplay, DOM overlay controls | Renderer byline/channel fields, learned maps, current watch route state | JSON rules, player overlay DOM, watch rail selectors | JSON removal, DOM hide, stats, possibly player UI mutation | Direct `endScreenVideoRenderer` is covered, but compact autoplay and DOM wall variants remain gaps | Capture-backed end-screen wall, compact autoplay, direct watch-card header/hero/RH panel, and sibling-visible fixtures |
| Shorts/reels | Main/Kids list mode, channel/keyword settings, whitelist mode | `shortsLockupViewModel`, `reelItemRenderer`, Shorts title text, sparse DOM | `/shorts/VIDEO_ID`, `videoChannelMap`, `ytInitialData`, player/Shorts resolver, owner renderer when present | Shorts DOM card selectors, quick-block/menu selectors, recycled-node marker cleanup | Hide, pending whitelist hide, background Shorts fetch, map write | Shorts DOM often exposes only video id; JSON may not have owner before render | Shorts matrix for title-only, owner present, owner missing, video-id join, fallback resolver, whitelist pending, and recycled DOM marker reset |
| Playlists/radio/mixes | Channel/keyword/list mode settings; watch playlist guard state | Playlist panel rows, compact playlist, radio/mix metadata, shelf titles | Playlist creator/owner, row video id joins, avatar-stack collaborator guesses, learned maps | Playlist DOM row selectors, selected-row detection, fallback playlist menu buttons | JSON pass-through/removal, DOM hide, selected-row click/pause, fallback block mutation | Compact playlist lacks direct JSON rule; selected row and avatar-stack paths can false-hide | Playlist/radio fixture matrix for compact playlist, playlist panel selected row, Mix/radio owner identity, avatar-stack non-collab, and no selected-row hide |
| Native and fallback 3-dot menus | `showBlockMenuItem`, list mode, profile/lock state, native overlay state | Menu snapshot text, clicked card metadata, post/comment/watch/playlist context | Snapshot identity, DOM extraction, learned maps, collaborator dialog data, `watch:` / `shorts:` resolver | Native dropdown listeners, fallback scanner, popover rows, playlist buttons, post/comment selectors | Block/whitelist mutation, background fetch, DOM hide, map writes, backup, runtime refresh | Primary and fallback menu gates differ; fallback playlist actions can bypass list-mode/menu settings | One action gate for desktop, mobile, playlist, posts, Shorts, Kids, disabled, whitelist, native overlay, and locked profile |
| Quick-cross / quick block | `showQuickBlockButton`, list mode, mobile/native overlay state, profile locks | Visible card title/byline/menu context | DOM extraction, data attributes, learned maps, card video id, channel logos | Page-wide selectors, scroll/touch/resize/listeners, observer, interval/sweep | Rule mutation, immediate hide, map/backup/refresh side effects | Lifecycle setup can exist before visible affordance gate; disabled/whitelist behavior is split from action behavior | Disabled/no-rule zero-lifecycle fixture plus enabled route/device fixtures and teardown/pause proof |
| Collaborator / showDialog / showSheet / avatar-stack recovery | Channel block/whitelist settings, collaborator menu action state, fallback menu context | Dialog/sheet roster text, `avatarStackViewModel`, collaboration card titles, Mix/radio metadata | `showDialogCommand`, `showSheetCommand`, collaborator caches, avatar-stack guesses, learned maps, dialog DOM recovery | `js/content/collab_dialog.js` permanent listeners and document-wide observer; main-world injector searches; content bridge pending-card state | Card identity mutation, collaborator cache writes, active menu refresh, page messages, map updates, DOM fallback reruns | `showDialogCommand` and `showSheetCommand` are not equivalent; avatar stacks can be non-collaborator identity; dialog helper can proceed when title is missing | Collaborator fixture matrix for showDialog, showSheet, avatar-stack non-collab, dialog title missing, pending timeout, map provenance, block-all, whitelist, and disabled/no-rule lifecycle |
| Posts/community | Channel/keyword settings, menu action gates, route/surface state | `postRenderer`, `sharedPostRenderer`, legacy backstage renderers, DOM post text | Author channel id/handle when present; DOM menu snapshot; learned maps | Post DOM selectors, menu injection/fallback scan, app/native post insertion paths | JSON removal/pass-through, DOM hide, 3-dot insertion, rule mutation | Modern post renderers and fallback menu scan coverage are partial | Post fixture for author, body keyword, shared original, menu insertion, disabled, whitelist, and sibling-visible behavior |
| YouTube Kids surface | Kids profile/list mode, Kids-to-Main sync, native/app shell state | Kids JSON owner extensions, public Kids web DOM/cards, watch/player state | `kidsVideoOwnerExtension`, learned `videoChannelMap`, Kids watch background resolver, app WebView route state | Kids passive listener, Kids card selectors, Android/iOS runtime copies, native controls | JSON hide, DOM hide, background Kids fetch, app/native shell visibility | Extension source and native app runtimes diverge; Kids watch DOM can be sparse | Kids route/player/surface-state report, profile/list proof, no unintended desktop menu injection, app runtime parity/freshness proof |
| YouTube Music surface | Main/YTM rule settings and route/surface checks | YTM JSON/DOM renderers, showSheet/showDialog, compact playlist | YTM renderer owners, collaborator rosters, learned maps, display text | YTM DOM selectors, menu/fallback gates, runtime route checks | JSON pass-through/removal, DOM hide, map writes | YTM capture proof is partial and several renderer paths pass through | YTM fixture set for compact playlist, showSheet roster, showDialog roster, DOM guardrails, disabled/whitelist modes |
| Import/export/Nanah/sync | StateManager, background, IO manager, security manager, Nanah adapter, V4 profile shape | Imported settings payloads and encrypted/plain backup files | Profile ids, trusted device ids, sync envelope metadata, learned identity maps in settings | UI import controls, runtime refresh broadcasts, storage listeners | Storage writes, backup, rollback gaps, runtime cache invalidation, native/app sync | Mutations bypass normal row UI and can change list mode/profile state without one revision report | Mutation intent fixture for receive/apply/reject/import/backup/rollback/list-conflict/target-profile and lock result |
| Subscribed-channel whitelist import | Subscription import UI state, list-mode transition, `copyBlocklist:false`, profile/lock state | `/feed/channels` page content, injected `FEchannels` data, YouTubei subscription continuation data | Imported channel UC ids, handles, display names, channel links, possible legacy custom URLs | `js/injector.js` subscription import bridge, `js/tab-view.js` import flow, background list-mode mutation, tab navigation/scroll/click automation | Opens YouTube tab, injects script, scrolls/fetches/clicks YouTube subscription UI, mutates whitelist/list mode, backup/runtime refresh | It is not the same as generic import/export; it is a YouTube-observable workflow and can trigger list-mode movement separately from normal row edits | Subscription import fixture for locked profile, copy false, empty/non-empty blocklist, imported UC/handle/name, navigation budget, backup, and no unintended blocklist merge |
| Stats/time-saved/dashboard | Hide/restore helper, background stats messages, StateManager/dashboard reads | Hidden element attributes, hide decision context, surface stats | Usually none, but false identity/hide decisions become counted success | DOM hide helper, storage listeners, dashboard render | Stats writes, decrement on restore, legacy/surface stats drift | False hides can be counted as product success; skipStats does not suppress media side effects | Structured hide-decision id and stats fixture proving visual/stats/media side effects separately |
| Security/PIN/profile viewing spaces | Security manager, StateManager, background mutations, profile type/session state | Profile metadata, viewing-space selection, UI route | Active/target profile ids and parent/child state | UI gating, background message gates, native/app controls | Rule/profile storage writes, runtime refresh, import/Nanah apply | Some mutation paths are UI-guarded while lower-level writers can still affect locked/child profiles | `securityLockAuthority` fixture for actor class, active profile, target profile, unlock class, deny reason, storage keys, and compiled revision |
| Prompt/onboarding/release-note coachmarks | Install/update settings, release-note schema, prompt ack state, replay trigger, What’s New URL | Prompt copy, release notes, viewport layout, mobile fit CSS | No channel identity; sender identity and URL class are the relevant trust inputs | `js/content/release_notes_prompt.js`, first-run prompt scripts, settings replay controls, background `FilterTube_OpenWhatsNew` action | DOM overlay insertion, ack storage write, tab open, release-note navigation, coachmark replay | Prompt owners are split; acknowledgement and What’s New navigation need sender/URL authority; mobile viewport fit is only locally proven | Prompt coordinator fixture for install/update/replay, ack sender class, allowlisted What’s New URL, mobile/desktop viewport, release-note schema, and no duplicate overlay |
| Release website/download/public claims | Build scripts, README, website pages, docs, release artifacts, native runtime sync | Public copy, release notes, screenshots/videos, privacy/download pages | Store package ids, artifact checksums, app/runtime freshness, Nanah/source links | Build/package scripts, website components, Vercel deployment root | GitHub release, package copy, website deploy, public claim expansion | Public claims can outrun artifact proof or native runtime freshness | Claim manifest tying every platform/store/download/privacy claim to code proof, artifact proof, owner, date, and release gate |

## Cross-Feature Source Flow

```text
settings/profile/list mode
        |
        +--> background compiled payload
        +--> shared UI payload
        +--> StateManager/import/Nanah writes
        |
        v
endpoint policy + JSON renderer rules
        |
        +--> renderer mutation
        +--> identity harvest
        +--> learned maps
        |
        v
DOM fallback / menu / quick block
        |
        +--> selectors and lifecycle work
        +--> hide/restore/stats/media side effects
        +--> background resolver or mutation path
```

## Current Missing Runtime Authority

No runtime symbol exists yet for:

- `featureSourceDependencyAuthority`
- `featureDependencyReport`
- `sourceConfidenceByFeature`

This register is a current audit artifact, not a runtime arbiter.

## Implementation Boundary

Before changing any feature above, the patch must name:

1. feature/workflow row
2. route/surface
3. settings mode and profile type
4. rule-state source
5. content/text source
6. identity source and confidence tier
7. selector/lifecycle owner
8. allowed side effects
9. positive fixture
10. negative nonmatching/sibling-visible fixture
11. no-work or budget fixture when page-resident
12. restore/cleanup fixture when DOM state is written

Until those fields are proven, the implementation gate stays closed.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
