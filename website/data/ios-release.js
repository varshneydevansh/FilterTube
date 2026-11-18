// The iPhone/iPad direct release, read from public/ios/source.json at build time. That file is the
// AltStore/SideStore source the "Add to SideStore" button points to, and the app repository's release
// script fills it (downloadURL, size, date, sha256). Nothing here is hand-edited: while the file
// still holds placeholders, the release counts as not published and the page says so instead of
// showing a link that can't install.
import source from "@/public/ios/source.json";

export const SOURCE_JSON_URL = "https://filtertube.in/ios/source.json";

const app = source.apps?.[0] ?? {};
const latest = app.versions?.[0] ?? {};

const isRealUrl = (value) => typeof value === "string" && /^https:\/\/\S+$/.test(value);
const isSha256 = (value) => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

/** True once a release has filled source.json with a real download. */
export const iosReleaseLive = isRealUrl(latest.downloadURL) && Number(latest.size) > 0;

/** A GitHub asset URL (.../releases/download/<tag>/<file>) maps to its release page. */
function releasePageFor(downloadURL) {
  const match = isRealUrl(downloadURL) && downloadURL.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+\/releases)\/download\/([^/]+)\//);
  return match ? `${match[1]}/tag/${match[2]}` : null;
}

export const iosRelease = {
  live: iosReleaseLive,
  version: latest.version ?? null,
  date: iosReleaseLive ? latest.date ?? null : null,
  downloadURL: iosReleaseLive ? latest.downloadURL : null,
  releaseURL: iosReleaseLive ? releasePageFor(latest.downloadURL) : null,
  sha256: iosReleaseLive && isSha256(latest.sha256) ? latest.sha256.toLowerCase() : null,
  sideStoreHref: `sidestore://source?url=${encodeURIComponent(SOURCE_JSON_URL)}`,
  altStoreHref: `altstore://source?url=${encodeURIComponent(SOURCE_JSON_URL)}`,
};
