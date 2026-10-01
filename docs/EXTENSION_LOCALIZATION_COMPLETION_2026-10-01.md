# Extension localization completion checkpoint

The local catalog now has 1,665 keyed messages in each of the 38 target languages, alongside 1,135 static dashboard fragments per language and the historical release-note translations. The additional 73 managed-link policy messages were translated locally and merged from two independently owned drafts (19 and 18 non-English locales).

`node scripts/check-ui-locales.mjs --require-all --require-all-static` passes. The merge tool now accepts independently owned drafts, rejects duplicate locale ownership or key-order differences, and validates placeholders and protected product names before catalog writes.

This count is not whole-interface coverage. Generated Family Devices controls, remaining dashboard actions, and shared component/runtime labels are being audited and wired separately. English remains the released automatic-language baseline until those gaps and selector/runtime validation are complete. No runtime model, API key, or hosted translation dependency was introduced.

Playback fixes were committed separately: `b1108ec6` preserves exact-video verified metadata across settings refreshes and unverified hints; `6f50a7ee` removes remaining autonomous playlist skip paths. These commits do not include the other pre-existing uncommitted admission/advert changes.
