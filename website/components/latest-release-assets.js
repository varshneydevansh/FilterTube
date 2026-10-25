const RELEASE_API = "https://api.github.com/repos/varshneydevansh/FilterTube/releases/latest";
const RELEASE_FALLBACK = "https://github.com/varshneydevansh/FilterTube/releases/latest";
const RELEASE_ROOT = "/varshneydevansh/FilterTube/releases/";
const MAX_ASSETS = 50;

function releaseUrl(value, kind) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const prefix = `${RELEASE_ROOT}${kind}/`;
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password || url.search || url.hash || !url.pathname.startsWith(prefix) || url.pathname.length <= prefix.length) return null;
    if (kind === "download" && url.pathname.slice(prefix.length).split("/").filter(Boolean).length < 2) return null;
    return url.href;
  } catch {
    return null;
  }
}

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function releaseModel(data) {
  if (!data || data.draft !== false || data.prerelease !== false || typeof data.tag_name !== "string" || !data.tag_name.trim() || data.tag_name.length > 128 || !Array.isArray(data.assets)) return null;
  const href = releaseUrl(data.html_url, "tag");
  if (!href) return null;
  const seen = new Set();
  const files = data.assets.slice(0, MAX_ASSETS).flatMap((asset) => {
    if (!asset || typeof asset.name !== "string" || !asset.name.trim() || asset.name.length > 240 || /[\u0000-\u001f\u007f]/.test(asset.name) || !Number.isSafeInteger(asset.size) || asset.size < 0) return [];
    const url = releaseUrl(asset.browser_download_url, "download");
    if (!url || seen.has(asset.name)) return [];
    seen.add(asset.name);
    return [{ name: asset.name, href: url, size: asset.size }];
  });
  if (!files.length) return null;
  const byName = new Map(files.map((file) => [file.name, file]));
  const pairedChecksums = new Set();
  const rows = files.filter((file) => !/\.sha256$/i.test(file.name)).map((file) => {
    const checksum = byName.get(`${file.name}.sha256`);
    if (checksum) pairedChecksums.add(checksum.name);
    return { ...file, checksum };
  });
  const main = rows.filter((file) => /\.(zip|xpi)$/i.test(file.name) || (/\.apk$/i.test(file.name) && !/debug/i.test(file.name)));
  main.sort((a, b) => Number(/\.apk$/i.test(a.name)) - Number(/\.apk$/i.test(b.name)));
  const mainNames = new Set(main.map((file) => file.name));
  const developer = [...rows.filter((file) => !mainNames.has(file.name)), ...files.filter((file) => /\.sha256$/i.test(file.name) && !pairedChecksums.has(file.name))];
  const published = typeof data.published_at === "string" ? new Date(data.published_at) : null;
  return {
    tag: data.tag_name,
    href,
    published: published && Number.isFinite(published.getTime()) ? published : null,
    main,
    developer,
    limited: data.assets.length > MAX_ASSETS || files.length !== data.assets.length,
  };
}

function DownloadRows({ files }) {
  return (
    <ul className="divide-y divide-[color:var(--color-line)]">
      {files.map((file) => (
        <li className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3" key={file.name}>
          <a className="min-w-0 flex-1 basis-64 break-all text-sm font-semibold text-[var(--color-ink)] underline underline-offset-4" href={file.href}>
            {file.name}
          </a>
          <div className="flex shrink-0 items-center gap-4 text-xs text-[var(--color-muted)]">
            <span>{fileSize(file.size)}</span>
            {file.checksum ? <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={file.checksum.href} aria-label={`SHA-256 checksum for ${file.name}`}>SHA-256</a> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export async function LatestReleaseAssets() {
  let release = null;
  try {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) release = releaseModel(await response.json());
  } catch {
    // Network, rate-limit and malformed-release failures retain the manual path.
  }

  return (
    <section className="ft-shell rounded-[2rem] border border-[color:var(--color-line)] p-5 md:p-7" aria-label="Latest GitHub release downloads">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-[var(--color-ink)]">Latest GitHub release</h2>
          {release ? <p className="mt-2 break-all text-sm text-[var(--color-muted)]">{release.tag}{release.published ? <> · <time dateTime={release.published.toISOString()}>{release.published.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></> : null}</p> : null}
        </div>
        <a className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-accent)] underline underline-offset-4" href={release?.href || RELEASE_FALLBACK} rel="noreferrer" target="_blank">View release on GitHub</a>
      </div>
      {release ? (
        <>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">Manual browser packages and direct APK files. Google Play provides the complete custom Android app; the direct APK is a separate, simpler build. Apple and TV availability is listed separately below.</p>
          {release.main.length ? <div className="mt-3"><DownloadRows files={release.main} /></div> : <p className="mt-4 text-sm text-[var(--color-muted)]">This release has no standard install packages. Other files are listed below.</p>}
          {release.developer.length ? (
            <details className="ft-disclosure mt-4 rounded-xl border border-[color:var(--color-line)] px-4 py-1">
              <summary className="cursor-pointer py-3 text-sm font-semibold text-[var(--color-ink)]">Developer files ({release.developer.reduce((count, file) => count + 1 + Number(Boolean(file.checksum)), 0)})</summary>
              <p className="mb-2 text-xs leading-6 text-[var(--color-muted)]">Debug APKs, app bundles and supporting files are for development or distribution workflows. An AAB is not a normal Android install file.</p>
              <DownloadRows files={release.developer} />
            </details>
          ) : null}
          {release.limited ? <p className="mt-3 text-xs leading-6 text-[var(--color-muted)]">Some files are not listed here. Open the release on GitHub for its complete asset list.</p> : null}
        </>
      ) : (
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">The latest release files could not be loaded here. Open the release on GitHub to see the available downloads.</p>
      )}
    </section>
  );
}
