# Bounded settings and export race contracts

This is one abstract TLA+ model with three configurations. It does not model
YouTube DOM structure, regex matching, cryptography, profile storage transactions,
network delivery or browser event scheduling. It is not a refinement of the
JavaScript implementation and does not resolve a reporter's installed symptoms.

The settings and authority revisions each range from 0 to 2. Initialization can
capture a revision, wait while another snapshot is published, then finish.
Export can review rules and authority, wait, then confirm. Final selection/check
and modeled action are atomic; real asynchronous boundaries require executable
tests independently.

- `Safe`: initialization uses the currently published revision and export requires
  the reviewed rule/authority revisions still to match. Both invariants pass.
- `UnsafeInit`: initialization uses its captured snapshot. TLC finds
  BeginInit → PublishSettings → FinishInit violating `FreshInitialization`.
- `UnsafeExport`: confirmation ignores review freshness. TLC finds a changed
  revision/authority after Review violating `FreshExportReview`.

The corresponding implementation boundaries are `applyDOMFallback` in
`js/content/dom_fallback.js` and `prepareBlockTubeExport`/`exportBlockTube` in
`js/io_manager.js`. Their actual-function tests include Disabled and verified
metadata retention, changed rules, parent authority, cancellation and stale
review tokens. Passing this model is additional design evidence, not a substitute
for those tests or installed browser acceptance. The comment-reply and empty
byline bugs require real tree/renderer tests and are outside this model.

Run with an already installed Java runtime and an official
[TLA+ tools JAR](https://github.com/tlaplus/tlaplus/releases):

```sh
python3 docs/audit/issue-safety-formal/check_models.py \
  --jar /path/to/tla2tools.jar \
  --report /tmp/filtertube-issue-model-results.json
```

The runner downloads nothing, keeps generated states outside the repository,
requires both expected unsafe counterexamples and records tool/model hashes.
`results-2026-10-17.json` contains the executed results.
