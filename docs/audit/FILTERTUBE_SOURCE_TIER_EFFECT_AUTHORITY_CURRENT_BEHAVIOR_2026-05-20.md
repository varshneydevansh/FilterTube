# FilterTube Source Tier / Effect Authority - Current Behavior - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This slice answers a specific ambiguity in the current documentation:

```text
XHR JSON interception
ytInitial* snapshots
DOM extraction
Network fetch
```

That priority order describes where FilterTube prefers to learn information. It
does not describe what that information is allowed to do. Today the runtime does
not have one authority record that says:

```text
source tier -> route/surface -> settings mode -> confidence -> allowed effects
```

That distinction matters because the same source can be used for different
effects:

- harvest identity only,
- mutate YouTube JSON,
- hide a DOM card,
- restore a stale DOM hide,
- stamp learned identity onto DOM,
- persist a map,
- open/fetch a resolver,
- optimistic-hide a user-clicked target,
- count a stat or time-saved event.

The lag and false-hide concerns are therefore not only about which source is
first. They are also about which source is allowed to spend work or create a
visible side effect.

## Current Source Tier / Effect Matrix

| Source tier | Current source owners | Current effects possible | Current risk | Future proof gate |
| --- | --- | --- | --- | --- |
| YouTubei fetch/XHR JSON | `js/seed.js`, `js/filter_logic.js` | endpoint clone/parse, `harvestOnly`, full `processData`, JSON renderer removal, network snapshot stash | A no-rule or disabled-feeling session can still spend endpoint body work before one shared no-work authority exists. JSON mutation and identity harvest are separate effects but are locally gated. | `endpointPolicy` plus `compiledRuleState` must prove zero parse/rewrite in no-work states and route-specific mutation in active states. |
| `ytInitialData` / `ytInitialPlayerResponse` | `js/seed.js`, `js/filter_logic.js`, `js/content_bridge.js` | startup clone/process, player owner harvest, main-world lookup for menu recovery, raw snapshot replay after settings update | Page globals can be stale, incomplete, or replayed. They can improve identity but do not automatically prove the clicked DOM target or every rendered sibling. | `sourceConfidenceDecision` must record freshness, route, video id, renderer family, and allowed effect. |
| Learned maps | `channelMap`, `videoChannelMap`, `videoMetaMap` through `js/filter_logic.js`, `js/content_bridge.js`, `js/background.js` | persist map, stamp DOM cards, rerun DOM fallback, enrich menu labels, join video id to channel id, influence JSON/DOM matches | A learned map is useful memory, but without provenance/revision it is not the same as fresh canonical identity. Map writes can also trigger DOM reruns. | `learnedIdentityAuthority` plus `identityWorkBudget` must record source, confidence, revision, write owner, rerun budget, and stale-map behavior. |
| DOM extraction | `js/content_bridge.js`, `js/content/dom_fallback.js`, menu/quick/fallback-menu paths | card/menu target extraction, DOM scan, pending whitelist hide, direct hide, restore marker cleanup, optimistic hide, background resolver trigger | DOM can be canonical only when stable links exist. Visible text, avatar labels, and video-id-only links are display-only or join keys. DOM target selection can still hide a broad parent. | `domIdentityConfidenceAuthority` and `hideDecisionAuthority` must separate display-only labels from hide/allow/stamp/persist authority and prove sibling-visible restore behavior. |
| Network fallback | `js/background.js`, legacy content-side fallback paths, menu action recovery | `watch:VIDEO_ID`, `shorts:VIDEO_ID`, Kids watch fetch, channel-detail fetch, post-block Shorts/playlist fanout | Network fallback is a last-resort resolver, but there are several resolver classes. Some are user-action scoped, some can fan out after a successful block. | `identityResolverAuthority` must record user-action class, exact target/fanout, cache hit/miss, credential policy, retry budget, and resulting map writes. |

## Important Current Boundaries

### 1. Source confidence is not work permission

The current runtime can know that a YouTubei response exists and still should
not necessarily parse, clone, mutate, harvest, or stringify it. Today that
decision is split across local checks in `seed.js`, renderer logic in
`filter_logic.js`, DOM fallback gates, settings mode, and learned-map side
effects.

Future no-work optimization must therefore prove both:

```text
information available: yes/no
work allowed: yes/no and why
```

### 2. Source confidence is not hide permission

A UC id from JSON, a video id from DOM, a handle from a menu snapshot, and a
name from visible text do not have the same authority. Blocklist mode can often
fail open when identity is weak. Whitelist mode can intentionally fail closed.
Those are different product semantics and must not be collapsed into one
"empty list" or "identity known" shortcut.

### 3. Harvest-only is still work

`harvestOnly` is safer than JSON mutation, but it is not zero work. It can learn
identity, post messages, update maps, and later cause DOM stamping or fallback
reruns. That can be valuable, but it needs a budget when the user reports lag on
fresh or empty installs.

### 4. DOM fallback is not just fallback identity

DOM fallback also owns restore cleanup, target selection, pending whitelist
state, metadata refresh, handle repair, fallback menu support, and quick/menu
visible target behavior. Deleting or broadening it based only on XHR-first
identity would break video-id-only surfaces such as Shorts, watch, playlist,
Kids, and some YouTube Music cards.

### 5. Network fallback is not one path

Current fallback includes:

- clicked-target `watch:VIDEO_ID` recovery,
- clicked-target `shorts:VIDEO_ID` recovery,
- Kids watch identity recovery,
- channel-detail fetch for unresolved menu targets,
- legacy content-side watch/Shorts helpers,
- post-block Shorts and playlist-row enrichment.

Those must be budgeted separately. The correct future question is not "can we
remove network fetch?" It is "which resolver class is allowed for this route,
mode, target, and user action?"

## Required Future Authority

The future runtime needs one decision object before behavior changes:

```text
sourceTierEffectAuthority {
  profileId,
  profileType,
  routeSurface,
  endpointFamily,
  rendererFamily,
  listMode,
  ruleState,
  sourceTier,
  sourceFieldsPresent,
  sourceConfidence,
  sourceFreshness,
  targetKind,
  targetVideoId,
  targetChannelId,
  userActionClass,
  allowedEffects,
  deniedEffects,
  noWorkReason,
  fallbackReason,
  mapWritePolicy,
  domScanPolicy,
  hidePolicy,
  restorePolicy,
  statsPolicy,
  networkPolicy,
  decision
}
```

Minimum future fixtures:

1. Empty blocklist Main home/search proves no endpoint mutation, no DOM scan,
   no menu/quick sweep, no resolver fetch, and no map-triggered DOM rerun.
2. Empty whitelist proves intentional fail-closed behavior without treating it
   as the same no-work policy as empty blocklist.
3. Shorts and watch video-id-only DOM prove map/player/JSON/fetch join behavior
   without guessing channel identity from unrelated visible text.
4. Learned map hit proves the map can join identity only with provenance and
   stale-map negative fixtures.
5. DOM display-only name proves it can label UI but cannot become canonical
   channel authority by itself.
6. User-clicked menu resolver proves exact target scope and no passive network
   work in no-rule sessions.
7. Post-block enrichment proves fanout budget and nonmatching sibling visibility.
8. Restore proof shows that stale hidden state is removed by the correct owner
   without counting a false hide as product success.

## Current Missing Runtime Authority

No runtime symbol exists yet for:

- `sourceTierEffectAuthority`
- `sourceTierEffectDecision`
- `sourceConfidenceDecision`
- `identityWorkBudgetDecision`
- `hideDecisionAuthority`
- `resolverEffectBudget`

This document is a current audit record, not permission to delete fallback
layers, broaden DOM inference, or optimize endpoint work.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this source-tier effect authority can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, route/surface effect changes, identity
source-tier changes, metric fixture approvals, no-work changes, or whitelist
behavior changes.
