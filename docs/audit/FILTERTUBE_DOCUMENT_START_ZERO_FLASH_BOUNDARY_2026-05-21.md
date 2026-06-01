# FilterTube Document-Start Zero-Flash Boundary - 2026-05-21

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This slice narrows one remaining implementation-risk phrase: document-start seed
injection exists to catch YouTube JSON and page globals as early as possible, but
it is not a global guarantee that every route is filtered before paint, and it
is not permission to spend endpoint/body/DOM work when no active rule can use
that data.

## Current Source Shape

```text
manifest document_start
        |
        v
js/seed.js
        |
        +--> establishDataHooks()
        +--> setupFetchInterception()
        +--> setupXhrInterception()
        +--> filterTubeSeedReady event
```

The top of `js/seed.js` still states that it must run before YouTube scripts to
ensure zero-flash filtering. That comment is directionally understandable, but
too broad as an implementation contract. Current audit evidence shows:

- JSON/player/page-global paths can filter before paint only when the endpoint,
  renderer shape, route, settings mode, and fields are covered.
- Missing settings can queue data and return the original object, so not every
  early payload can still enforce after first paint.
- Empty blocklist or disabled states can still install hooks, mark endpoints,
  parse/clone data, harvest metadata, and replay queued work.
- Watch, Shorts, playlist, Kids, YTM, collaborators, posts, and weak menu
  targets can still need learned maps, DOM extraction, or scoped background
  resolvers.

## Safe Claim

Document-start seed injection is a startup capability:

```text
early enough to observe and sometimes mutate supported YouTube JSON/page-global
payloads before YouTube renders them, when active rules and covered fields prove
that mutation is allowed.
```

It is not a blanket guarantee:

```text
all blocked content is removed before paint
all routes are zero-flash
empty installs are zero-work
fallback resolvers can be deleted
DOM fallback can trust video-id-only surfaces
```

## Why This Matters

The same early hook that enables pre-render filtering can also be the first
source of empty-install lag:

```text
"must be zero-flash"
      |
      v
install page-global fetch/XHR/global hooks
      |
      v
clone / stringify / parse / process / queue payloads
      |
      v
settings later prove no active rule needed the work
```

So the correct future optimization is not to delete document-start hooks. It is
to preserve early observation while putting expensive work behind a cheap
decision:

```text
endpoint + source kind + route + settings revision + active-rule state
        |
        v
documentStartWorkDecision
        |
        +--> observe only
        +--> harvest only
        +--> mutate JSON
        +--> queue for replay
        +--> pass through without clone/parse
```

## Required Future Proof

Before changing document-start seed behavior, any patch must prove:

1. which endpoint/global is being observed,
2. whether settings are loaded,
3. whether active rules can use the payload,
4. whether the route/surface supports JSON mutation or harvest-only work,
5. whether payload fields are sufficient for hide/allow decisions,
6. whether the response can still be rewritten before YouTube consumes it,
7. no-work behavior for empty blocklist, empty whitelist, and disabled state,
8. player-response metadata versus mutation policy,
9. queue retention and replay budget,
10. negative proof that nonmatching siblings remain visible.

## Implementation Boundary

Missing future authority symbols:

- `documentStartWorkDecision`
- `zeroFlashClaimAuthority`
- `prePaintMutationDecision`
- `seedNoWorkDecision`
- `initialGlobalReplayBudget`

Until those exist, document-start and zero-flash wording must be treated as a
capability boundary, not a completed performance or correctness guarantee.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
