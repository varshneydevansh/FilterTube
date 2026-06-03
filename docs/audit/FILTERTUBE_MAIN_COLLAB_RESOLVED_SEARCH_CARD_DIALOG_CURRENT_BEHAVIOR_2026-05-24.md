# FilterTube Main Collab Resolved Search Card Dialog Current Behavior - 2026-05-24

Status: audit-only proof. Runtime behavior is unchanged.

This slice reduces one real `collab.html` Main search collaboration capture into
`tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html`.
It is not a behavior patch and does not declare collaborator filtering ready.

## Source Boundary

`collab.html` is ignored raw evidence. It is a rendered DOM snapshot after
FilterTube mutation, not direct JSON and not clean pre-extension page markup.

Pinned raw capture facts:

| Fact | Value |
| --- | --- |
| Raw file | `collab.html` |
| SHA-256 | `6e4813758c6d9f1f770b3989a03d4c9008cdaac5bda053b159d4368043bb2a26` |
| Newline count | 2065 |
| Bytes | 204819 |
| `data-filtertube-collaborators` tokens | 1 |
| `data-filtertube-blocked-state` tokens | 1 |
| `data-filtertube-collab-state` tokens | 1 |
| `yt-avatar-stack-view-model` tokens | 20 |
| `Collaboration channels` tokens | 3 |
| `tp-yt-paper-dialog` tokens | 3 |
| `/channel/` roster links | 4 |

## Reduced Fixture

The committed fixture keeps only the card and dialog details needed for the
audit:

| Evidence | Current value |
| --- | --- |
| Video id | `d95J8yzvjbQ` |
| Visible title | `The Thinking Game | Full documentary | Tribeca Film Festival official selection` |
| Display byline | `Google DeepMind and 3 more` |
| Collaborator ids | `UCP7jMXSY2xbc3KCAE0MHQ-A`, `UC0SOuDkpL6qpIF1o4wRhqRQ`, `UCDf32-QfUZUiQZSSb1av4lw`, `UCfBq6V0LDqDp2V37R1xfKUA` |
| Collaborator handles | `@googledeepmind`, `@thethinkinggamefilm`, `@rocofilms`, `@reelasdirtofficial` |
| Block marker | `data-filtertube-blocked-state="pending"` for `UCP7jMXSY2xbc3KCAE0MHQ-A` |
| Resolved state | `data-filtertube-collab-state="resolved"` and `data-filtertube-expected-collaborators="4"` |
| Menu evidence | Native `aria-label="Action menu"` exists on the same card |
| Dialog evidence | `tp-yt-paper-dialog` with four `/channel/UC...` roster links and handle/subscriber text |

The earlier `main-collab-homepage-avatar-stack.html` fixture proves the opposite
identity boundary: avatar-stack display text can exist while collaborator UC IDs
are blank. This `collab.html` slice proves a resolved roster form also exists,
so future collaborator logic needs a mode/surface/source/effect decision before
treating either form as enough to hide, allow, mutate menus, or persist learned
identity.

## Current Risk Before Optimization

- Resolved collaborator IDs can coexist with a `pending` blocked marker on an
  already-mutated DOM card.
- The fixture has canonical `/channel/UC...` dialog links, but no
  `data-filtertube-collaborators-source` or timestamp marker.
- The same surface also exposes avatar-stack display text and a native action
  menu, so menu actions, DOM state, and roster evidence can drift.
- Whitelist/blocklist optimization still needs positive and negative sibling
  fixtures before using resolved collaborator DOM as hide/allow authority.

## Future Contract Names

The following names are audit labels for missing future contracts and are
intentionally absent from product runtime source today:

```text
mainCollabResolvedSearchCardContract
mainCollabResolvedDialogRosterReport
mainCollabResolvedDomStateReport
mainCollabResolvedMenuActionPolicy
mainCollabResolvedWhitelistPolicy
mainCollabResolvedPendingBlockStateReport
mainCollabResolvedSourceEffectBudget
mainCollabResolvedSiblingVisibilityFixture
mainCollabResolvedJsonFirstGate
```

## Proof Command

```bash
node --test tests/runtime/main-collab-resolved-search-card-dialog-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
