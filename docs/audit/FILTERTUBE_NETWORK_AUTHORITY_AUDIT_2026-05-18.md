# FilterTube Network Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

## Why This Slice Exists

Network work is one of the clearest ways FilterTube can accidentally create
performance cost or observable YouTube-side activity. The product has three
different network families today:

```text
passive interception
  -> seed fetch/XHR wrappers observe and rewrite YouTubei responses

active extension fetches
  -> release notes JSON
  -> channel/watch/shorts/Kids identity HTML fetches
  -> subscription import YouTubei browse fetch

public website remotes
  -> Vercel Web Analytics
  -> CDN browser-logo images
  -> public links to stores/GitHub/YouTube
```

These are not equivalent. A release-note fetch from an extension resource is
not a YouTube-visible identity fetch, and a user-requested subscription import
is not normal feed filtering. The current code does not have one authority that
classifies these surfaces by owner, route, trigger, credentials, rate budget,
and whether the action is user-initiated.

## Current Network Primitive Counts

Authoritative scan command:

```bash
node - <<'NODE'
const fs=require('fs'), cp=require('child_process');
const files=cp.execFileSync('git',['ls-files','*.js','*.mjs','*.jsx'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).filter(f=>!f.includes('/vendor/'));
const pats={fetch:/\bfetch\s*\(/g, xhr:/\bXMLHttpRequest\b/g, credentials:/credentials\s*:/g, tabsCreate:/tabs\.create\s*\(/g, open:/window\.open\s*\(/g};
let total={fetch:0,xhr:0,credentials:0,tabsCreate:0,open:0};
for(const f of files){const t=fs.readFileSync(f,'utf8'); let row={}; let sum=0; for(const [k,p] of Object.entries(pats)){const n=(t.match(p)||[]).length; row[k]=n; total[k]+=n; sum+=n;} if(sum) console.log(f, JSON.stringify(row));}
console.log('TOTAL', JSON.stringify(total));
NODE
```

Current tracked non-vendor totals:

```text
fetch: 14
XMLHttpRequest references: 2
credentials option sites: 11
tabs.create: 3
window.open: 7
```

| File | Fetch/network shape |
| --- | --- |
| `js/background.js` | 7 fetches, 6 credential option sites, 1 tab create. Owns release notes, watch/shorts/Kids watch identity fallback, channel details fetch, and What's New tab open. |
| `js/content_bridge.js` | 4 fetches, 3 credential option sites. Owns watch metadata, shorts fallback, and watch fallback fetches. |
| `js/injector.js` | 1 credentialed YouTubei browse fetch for explicit subscription import. |
| `js/content/handle_resolver.js` | 1 same-origin handle page fetch. |
| `js/tab-view.js` | 1 extension release-note fetch plus tab/window open surfaces. |
| `js/seed.js` | 2 `XMLHttpRequest` prototype references plus `window.fetch` interception. |
| `js/popup.js` and `js/content/release_notes_prompt.js` | Window open surfaces. |

## Current Network Families

### Ignored Raw Capture Boundary

Root-level ignored HTML/JSON/TXT captures may contain YouTube URLs, API paths,
renderer bodies, and DOM fragments. Those files are evidence inputs only. They
helped build `docs/json_paths_encyclopedia.md` and
`docs/youtube_renderer_inventory.md`, but they are not runtime source and must
not become fetch targets, allowlists, or shipped data dumps. Any future network
or endpoint fixture should extract the smallest representative committed
fragment with source-family metadata.

### Extension-Resource Fetches

`loadReleaseNotesData()` fetches `browserAPI.runtime.getURL('data/release_notes.json')`.
`tab-view.js` also fetches `data/release_notes.json` for dashboard release notes.

Sources: `js/background.js:1719-1730`, `js/tab-view.js:2660-2670`.

Risk: low YouTube impact, but still needs release/public claim authority so
release notes cannot be confused with runtime filtering.

### YouTube Identity Fallback Fetches

Background fetches:

- `https://www.youtube.com/shorts/${videoId}` with `credentials: 'include'`
- `https://www.youtubekids.com/watch?v=${videoId}` with `credentials: 'include'`
- `https://www.youtube.com/watch?v=${videoId}` with `credentials: 'include'`
- `https://www.youtube.com/...` channel pages with `credentials: 'include'`
- public channel fallback with `credentials: 'omit'`

Sources: `js/background.js:2889-2893`, `3005-3009`,
`3098-3102`, `4617-4620`, `4631-4634`, `4784-4790`.

Content bridge fetches:

- `https://www.youtube.com/watch?v=${videoId}` with `credentials: 'same-origin'`
- `/shorts/${videoId}` with `credentials: 'same-origin'`
- `/watch?v=${videoId}` with `credentials: 'same-origin'`

Sources: `js/content_bridge.js:1769-1775`, `8120-8128`,
`8251-8277`.

Risk: these requests can be YouTube-visible and can contribute to perceived
engagement or performance cost if called outside explicit user action or
validated active-rule need.

### Subscription Import Fetches

The subscription importer performs user-requested `POST` requests to
`/youtubei/v1/browse` with `credentials: 'include'`.

Source: `js/injector.js:1426-1434`.

Risk: intended when the user starts import, but must never be callable by
normal filtering, route refresh, or unowned page messages.

### Passive YouTubei Interception

`seed.js` wraps `window.fetch` and `XMLHttpRequest` for:

- `/youtubei/v1/search`
- `/youtubei/v1/guide`
- `/youtubei/v1/browse`
- `/youtubei/v1/next`
- `/youtubei/v1/player`

Sources: `js/seed.js:606-687`, `692-725`.

Risk: even passive interception can clone, parse, stringify, or rewrite
responses on empty/disabled states unless endpoint policy proves pass-through.

### Website Remote Surfaces

The website imports Vercel Web Analytics and uses CDN-hosted browser logos.

Sources: `website/app/layout.js:7`, `website/components/route-content.js:35-65`.

Risk: this is website-only and not extension/app runtime behavior, but public
privacy copy and performance claims must keep it separate.

## Required Future Authority

Future token: `networkAuthority`

Required shape:

```text
networkAuthority.request({
  owner,
  url,
  method,
  credentials,
  trigger,
  route,
  targetSurface,
  userInitiated,
  activeRuleReason,
  maxPerNavigation,
  cachePolicy,
  timeoutMs
})
```

Every active fetch should be classifiable as one of:

- `extension_resource`
- `passive_youtubei_intercept`
- `explicit_subscription_import`
- `identity_fallback`
- `metadata_fetch`
- `public_website_remote`
- `external_navigation`

## P0 Fixture Gates

```text
network_authority_counts_all_tracked_fetch_xhr_open_surfaces
network_authority_release_note_fetches_are_extension_resource_only
network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason
network_authority_kids_identity_fetch_requires_kids_surface_reason
network_authority_channel_detail_fetch_rejects_untrusted_sender
network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason
network_authority_subscription_import_fetch_requires_explicit_user_import
network_authority_seed_interception_no_rule_passes_through_without_parse
network_authority_fetch_credentials_policy_is_declared_per_owner
network_authority_website_remotes_are_website_only_claims
network_authority_external_tab_open_urls_are_allowlisted
network_authority_raw_capture_urls_never_become_runtime_fetch_targets
```

## Implementation Rule

Do not change direct fetch fallback, subscription import fetch, seed
fetch/XHR interception, tab/window open behavior, website remote assets, or
credential policy until the relevant network authority fixture exists. The safe
first step later is a read-only network owner report and counters, not behavior
changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network authority audit can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
