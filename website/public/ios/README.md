# iOS source file

`source.json` is the AltStore/SideStore source. The /ios page reads it at build time
(`website/data/ios-release.js`), so a release only edits this one file.

The app repository's release script fills these fields of `apps[0].versions[0]`; don't hand-fill them:

- `downloadURL`: the GitHub release asset URL of the .ipa
  (`https://github.com/<owner>/<repo>/releases/download/<tag>/<file>.ipa`).
- `size`: the IPA size in bytes.
- `date`: the release date, `YYYY-MM-DD`. Also `version` and `buildVersion`.
- `sha256`: the IPA's SHA-256, lowercase hex.

What the page derives from them:

- While `downloadURL` is not an `https://` URL or `size` is 0, the "Add FilterTube" buttons (SideStore
  and AltStore) show "Coming with the first iPhone release" instead of a link that can't install.
- Once both are real, the buttons open `sidestore://source?url=https://filtertube.in/ios/source.json`
  and `altstore://source?url=...`.
- The "Official GitHub release" link is the release page for the asset's tag, worked out from
  `downloadURL`.
- The SHA-256 shown under "Verify the download" is `sha256`.

After the file changes, rebuild and deploy the website. Optionally set `VIDEO_URL` in
`website/app/ios/page.js` to show the walkthrough slot.

Format reference: https://faq.altstore.io/developers/make-a-source
