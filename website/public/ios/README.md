# iOS source file (for the owner)

`source.json` is the AltStore/SideStore source that the "Add FilterTube" button on /ios points to.
Fill these placeholders when the IPA is released:

1. `downloadURL`: replace `GITHUB_RELEASE_IPA_URL` with the GitHub release asset URL of the .ipa
   (right-click the asset on the release page, copy link).
2. `size`: the IPA size in bytes. `stat -f%z FilterTube.ipa` on macOS, `stat -c%s FilterTube.ipa` on Linux.
3. `date`: the release date, `YYYY-MM-DD`. Also check `version` and `buildVersion`.
4. SHA-256: `shasum -a 256 FilterTube.ipa`. The source format has no checksum field, so put the
   value in `IPA_SHA256` in `website/app/ios/page.js` and in the release notes.
5. In `website/app/ios/page.js`, set `SOURCE_JSON_URL` to `https://filtertube.in/ios/source.json`
   and `GITHUB_RELEASE_URL` to the release page. Optionally set `VIDEO_URL` to show the walkthrough slot.

Format reference: https://faq.altstore.io/developers/make-a-source
