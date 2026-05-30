# FilterTube P0 Prompt / Onboarding Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

The P0 prompt/onboarding family is not green. The existing prompt audit maps
the surface; this slice turns the readiness-gate names into runnable proof so
future coachmark, first-run, or release-banner changes cannot add another
independent overlay owner without proving priority, sender trust, URL authority,
viewport fit, and release-note schema first.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Current Answer

FilterTube currently has two page prompt owners and no shared prompt
coordinator:

```text
manifest document_start isolated scripts
        |
        +--> js/content/release_notes_prompt.js
        |       - asks background for release payload
        |       - shows #ft-release-notes-banner
        |       - acks version through FilterTube_ReleaseNotesAck
        |       - asks background to open FilterTube_OpenWhatsNew with caller URL
        |
        +--> js/content/first_run_prompt.js
                - asks background for firstRunRefreshNeeded
                - shows #ft-first-run-refresh-prompt
                - marks complete through FilterTube_FirstRunComplete
```

The install path is relatively narrow because it sets
`releaseNotesSeenVersion` to the current version and `firstRunRefreshNeeded` to
`true`, so the first-run refresh prompt is the intended visible owner. That is
still not a general prompt authority: there is no `PromptCoordinator`,
`promptQueue`, `activePromptOwner`, sender-classed acknowledgement contract, or
single overlay registry.

The update path can make both prompt families eligible: it builds a release
payload and sets `firstRunRefreshNeeded: true`, while the manifest-loaded
release prompt can independently render when `releaseNotesPayload.version` has
not been acknowledged.

## P0 Fixture Names

| Fixture | Current result | Proof summary |
| --- | --- | --- |
| `install_shows_one_prompt_owner` | Partial, not authority-backed | Install writes `releaseNotesSeenVersion: CURRENT_VERSION` and `firstRunRefreshNeeded: true`, but no prompt owner report proves why only one prompt may render. |
| `update_prompt_priority_is_explicit` | Not satisfied | Update writes `releaseNotesPayload` and `firstRunRefreshNeeded: true`; release and first-run prompt scripts load independently. |
| `replay_prompt_has_named_owner` | Not satisfied | No source token for a replay owner, prompt queue, active prompt owner, or coachmark replay authority exists. |
| `prompt_ack_rejects_wrong_sender_class` | Not satisfied | `FilterTube_ReleaseNotesAck` and `FilterTube_FirstRunComplete` write storage without the trusted UI sender guard or prompt-instance capability. |
| `whats_new_url_is_allowlisted` | Not satisfied | `FilterTube_OpenWhatsNew` opens `request.url || WHATS_NEW_PAGE_URL`; release prompt sends `targetLink`. |
| `prompt_overlay_fits_mobile_viewport` | Partial, not authority-backed | Both prompts have a `max-width: 600px` CSS fallback, but no safe-area, visual viewport, top chrome, arrow, or one-at-a-time overlay proof. |
| `current_manifest_version_has_release_note_entry` | Locally satisfied today | Current manifest/package version `3.3.1` is present in `data/release_notes.json`, while `3.3.2` is staged ahead of the package version. |

## Required Future Authority

Before prompt or coachmark behavior changes, a `promptCoordinator` or equivalent
report must name:

```text
promptCoordinator {
  ownerId
  reason: install | update | replay | release-note | settings-trigger
  priority
  eligible: true | false
  visible: true | false
  blockedByOwnerId
  senderClass
  ackAllowed: true | false
  urlClass
  viewportFit
  releaseNoteVersion
}
```

Future behavior must be proven with fresh-install, update-overlap, replay,
wrong-sender ack, allowed/disallowed What’s New URL, mobile viewport, and
release-note-current-version fixtures.

## Verdict

P0 prompt/onboarding is not implementation-ready. Runtime behavior remains unchanged in this slice.
