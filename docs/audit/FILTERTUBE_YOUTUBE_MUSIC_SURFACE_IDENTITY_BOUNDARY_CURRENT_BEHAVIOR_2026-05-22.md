# FilterTube YouTube Music Surface Identity Boundary - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.
This is not an implementation patch, selector patch, JSON renderer promotion,
YTM profile change, or optimization patch. It is also not completion proof for YTM surface authority.

## Scope

This slice covers the current YouTube Music boundary where YTM is admitted by
generic `*.youtube.com` manifest scope, compiled as the Main profile unless the
host is YouTube Kids, and then handled through a mix of JSON renderer rules,
YTM-shaped DOM selectors, learned `videoChannelMap` joins, main-world fallback,
and partially extracted raw capture fixtures.

It extends the open settings-mode, route/surface, JSON path, DOM selector,
learned-identity, message/effect, performance-risk, reliability,
false-hide/leak, code-burden, cross-feature, source/evidence, and
implementation-change rows. It keeps the implementation gate closed.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6803 | 306710 | `57ddc6c3e31112c30734ede78c9b37b01bd31533fc8a1d16856b13d2b295f0d7` |
| `js/content/bridge_settings.js` | 1127 | 44545 | `fad07aba48391021d5e42096b34f32c58a6337a1a4d303a8706927c541d47f71` |
| `js/content/dom_extractors.js` | 1137 | 46896 | `adf2c04f14f0f3bb44556e216af25aca8ff182dfa569c248ddb150d0cca38a4e` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Source And Effect Blocks

YTM surface identity source/effect blocks: 10.

| Block | Lines | Bytes | SHA-256 | Current boundary |
| --- | ---: | ---: | --- | --- |
| `js/content/dom_extractors.js` `VIDEO_CARD_SELECTORS` | 51 | 1722 | `10ffc854988084bde4baa837678b5b86a050e4ba25412edd7dfba88d11b52f46` | Mixes Main, mobile, watch-card, playlist, YTM, and Kids selectors before route/surface authority. |
| `js/content/bridge_settings.js` profile classifier | 10 | 293 | `23220109db4388b3c5a598e9c9670897e3f87de89f03773915ae4bd0ccc1647d` | Returns Kids only for `youtubekids.com`; YTM falls to Main. |
| `js/background.js` `isKidsUrl()` | 5 | 100 | `f047c93e3c8c536aecaf29675963715265595d6765a84dbb2a62ecda0ba99f37` | Background profile selection also distinguishes only Kids from Main. |
| `js/filter_logic.js` `videoWithContextRenderer` rule | 17 | 1109 | `d450343b0e7ac9e55be8f772e13af5c5f4a5e840430f7dafebc524542e3d7f39` | Direct YTM-like video cards can use headline/byline fields when present. |
| `js/filter_logic.js` rich item nested renderer preference | 22 | 932 | `9247e6a642b1dd0f2a99a62687c0eb186d11e353efe37cae0d39c2d670c27ce6` | `compactPlaylistRenderer` is unwrapped but still has no direct `FILTER_RULES` entry. |
| `js/content_bridge.js` sheet-like collaborator extraction cluster | 239 | 12385 | `c4ea7be576d449484a8a503b0203f21a2b3b22fbecb2adbec0daff6846622d03` | Content-side collaborator extraction scans `showSheetCommand` and `showDialogCommand` variants that filter logic does not treat equivalently. |
| `js/content_bridge.js` YTM video card extraction branch | 86 | 4630 | `333204f5a678fd0e669cf55f44d0959b061d54ae7bbd779c81e08d10515245d9` | YTM DOM can return stable channel links when no collaboration signal is present. |
| `js/content_bridge.js` mapped YTM fallback branch | 33 | 1503 | `86b9bc591274e52c031b99ba7d32be2a501dd73ce7720c0fdd83def999b16fb8` | YTM fallback can join `videoChannelMap` to a UC id and still request `mainworld` repair. |
| `js/content/dom_fallback.js` YTM style selector cluster | 304 | 11188 | `baeace1c72cdd1bce7399895995477f895800080a659afe0a33459a1d6cc84ae` | YTM selectors are emitted by broad content-control CSS branches. |
| `js/content/dom_fallback.js` YTM channel selector cluster | 38 | 2211 | `c2df107f368074e365d6ff6ee7603638279a4523839ab0dbbbf5fc9237711eb2` | DOM fallback reads YTM byline/link selectors as channel evidence without a YTM-specific authority report. |

## Selected Counts

- VIDEO_CARD_SELECTORS block `ytm-` tokens: 14.
- bridge profile classifier `youtubekids.com` tokens: 1.
- bridge profile classifier `music.youtube.com` tokens: 0.
- background `isKidsUrl()` `youtubekids.com` tokens: 1.
- background `isKidsUrl()` `music.youtube.com` tokens: 0.
- filter_logic total `videoWithContextRenderer` tokens: 10.
- filter_logic total `compactPlaylistRenderer` tokens: 1.
- filter_logic total `showDialogCommand` tokens: 11.
- content_bridge sheet-like collaborator block `showSheetCommand` tokens: 14.
- content_bridge sheet-like collaborator block `showDialogCommand` tokens: 12.
- content_bridge sheet-like collaborator block `videoWithContextRenderer` tokens: 7.
- content_bridge YTM video card extraction block `ytm-` tokens: 23.
- content_bridge mapped YTM fallback block `mainworld` tokens: 1.
- dom_fallback YTM style selector cluster `ytm-` tokens: 22.
- dom_fallback YTM style selector cluster control tokens: `hideHomeFeed` 1, `hideWatchPlaylistPanel` 1, `hideMixPlaylists` 1, `hideAllComments` 1.
- dom_fallback YTM channel selector cluster `ytm-` tokens: 23.
- Manifest generic `*.youtube.com` match/host patterns: Chrome 4, generic 4, Opera 4, Firefox 3.
- Manifest explicit `music.youtube.com` patterns: 0.
- Runtime YTM surface identity fixtures: 10.

## Current Behavior

| Boundary | Current behavior | Risk before optimization or JSON-first promotion |
| --- | --- | --- |
| Host/profile | YTM is covered by generic `*.youtube.com` manifest patterns and is classified as Main by bridge and background profile logic. | A future YTM optimization cannot assume a dedicated profile or viewing-space gate exists. |
| Direct JSON video cards | `videoWithContextRenderer` has direct rule fields for video id, headline/title, byline, channel id, and channel handle. | Direct YTM-like video cards can be valid JSON-first candidates only when those fields are present and route/effect proof exists. |
| Compact playlist JSON | `compactPlaylistRenderer` is unwrapped from `richItemRenderer`, but there is no direct rule entry for it. | Captured YTM compact playlist cards can leak matching title or creator channel rules. |
| Sheet collaborators | Content bridge extracts `showSheetCommand` rosters, but current filter logic channel matching does not use the captured YTM sheet roster as a blocklist identity. | Collaborator fixes can otherwise create blocklist leaks or whitelist false hides depending on which layer is changed first. |
| DOM selector surface | `VIDEO_CARD_SELECTORS` and DOM fallback contain many YTM-shaped selectors. | Broad scans and hides can cross Main mobile/YTM/Kids surfaces without per-route target-shape proof. |
| Learned map fallback | YTM fallback can use `videoChannelMap` to attach a mapped UC id and still request `mainworld` repair. | Joined identity must record freshness, profile, and allowed effects before it drives hide, allow, or persistence decisions. |
| Capture provenance | Reduced YTM fixtures exist for compact playlist JSON, watch playlist-panel JSON, sheet collaborator JSON, end-screen JSON, one video DOM card, one post DOM card, one watch/player DOM fixture, and one browse `channelListItemRenderer` JSON fixture; raw YTM logs and broader watch/player modes remain local evidence. | YTM watch/player pass-through, no-playback side-effect proof, disabled/no-work browse budget, whitelist policy, and route-scoped negative sibling proof are still incomplete. |

## Runtime Fixture Results

- Direct synthetic `videoWithContextRenderer` blocks by title keyword and channel id when byline fields are present.
- Extracted `ytm-compact-playlist-renderer.json` passes through matching title and channel rules.
- Extracted `ytm-watch-playlist-panel-json.json` filters supported YTM watch playlist-panel rows in blocklist and whitelist modes but lacks the selected/current DOM row.
- Extracted `ytm-show-sheet-collab-video-with-context-renderer.json` passes through a matching collaborator channel in blocklist mode.
- The same extracted show-sheet collaborator fixture is removed in whitelist mode even when the collaborator is whitelisted, because no allow identity is extracted by the JSON rule.
- Extracted `ytm-end-screen-video-renderer.json` blocks by captured title keyword through the existing direct end-screen rule.
- Extracted `ytm-browse-channel-list-item-renderer.json` passes through matching blocklist keyword/channel and whitelist channel modes while still queuing two channel-map side effects from browse endpoints.
- Extracted `ytm-dom-video-card-with-menu.html` proves a YTM video card can expose a canonical channel link, video id, native `ytm-menu-renderer`, and FilterTube quick-block anchor.
- Extracted `ytm-dom-post-card-with-menu.html` proves a YTM/backstage-style post can expose author and native action-menu structure without a FilterTube menu item already inserted.
- Extracted `ytm-watch-player-dom.html` proves a rendered mobile watch/player DOM capture can contain `#movie_player`, `ytm-watch-player-controls`, a hidden related item, a selected hidden playlist row, a visible sibling, and a nonselected hidden sibling after FilterTube mutation.

## Risks

- Reliability: YTM behaves as Main profile while using YTM-specific renderers and DOM tags, so profile-level proof is not enough.
- False-hide/leak: `videoWithContextRenderer` can be a supported direct JSON row, while compact playlists, sheet collaborators, and selected watch/player playlist rows remain partial.
- Performance: broad YTM DOM selectors can wake scans even when a future JSON-first path might be sufficient for a narrower route.
- Code burden: identity handling is split across filter logic, content bridge, DOM fallback, bridge settings, background profile choice, and capture provenance.

## Future Proof Required Before Behavior Changes

Before changing YTM JSON filtering, selector use, map trust, profile handling, or
no-work optimization, add fixture-backed reports for:

```text
ytmHostProfileDecision
ytmRouteSurface
ytmRendererType
ytmJsonPath
ytmDomSelector
ytmIdentityTier
ytmMapFreshness
ytmListMode
ytmAllowedEffects
ytmForbiddenEffects
ytmPositiveFixture
ytmNegativeSiblingFixture
ytmNoRuleBudget
ytmDisabledBudget
ytmWhitelistBehavior
ytmRestoreProof
ytmMetricArtifact
```

No `youtubeMusicSurfaceIdentityContract`,
`youtubeMusicSurfaceDecisionReport`, `youtubeMusicProfilePolicy`,
`youtubeMusicRendererAuthority`, `youtubeMusicDomSelectorPolicy`,
`youtubeMusicShowSheetParityReport`, `youtubeMusicCompactPlaylistDecision`,
`youtubeMusicFixtureProvenance`, `youtubeMusicMetricArtifact`, or
`youtubeMusicJsonDomParityGate` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this YouTube Music/YTM surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, YTM behavior, Music surface behavior,
whitelist behavior, metric collectors, artifact creation, native sync, release
package changes, or public claims.
