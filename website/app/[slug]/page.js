import { notFound } from "next/navigation";

import {
  detailPages,
  platformOrder,
} from "@/components/route-content";
import { ScenicDetailPage } from "@/components/scenic-detail-page";
import { JsonLd, allApps, softwareApplicationsJsonLd } from "@/lib/structured-data";

export const dynamicParams = false;

// Pages with a Markdown copy at /<slug>.md (see lib/markdown.js).
const markdownSlugs = new Set(["android", "extension", "kids"]);

// Which FilterTube apps each page is about, for its SoftwareApplication JSON-LD. Pages not listed
// (Fire TV, which is only planned, and ML & AI research) get none.
const appsOnPage = {
  extension: ["extension"],
  mobile: ["android", "ios"],
  ipados: ["ios"],
  android: ["android"],
  tv: ["android"],
  "android-tv": ["android"],
  kids: allApps,
};

export function generateStaticParams() {
  // /ios has its own route (app/ios/page.js) with the direct-install guide.
  return platformOrder
    .filter((slug) => slug !== "ios")
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = detailPages[slug];

  if (!page) {
    return {};
  }

  return {
    title: page.seoTitle ?? page.navTitle,
    description: page.seoDescription ?? page.description,
    alternates: {
      canonical: `https://filtertube.in/${slug}`,
      ...(markdownSlugs.has(slug) ? { types: { "text/markdown": `https://filtertube.in/${slug}.md` } } : {}),
    },
    openGraph: {
      title: `FilterTube ${page.navTitle}`,
      description: page.seoDescription ?? page.description,
      url: `https://filtertube.in/${slug}`,
    },
    twitter: {
      title: `FilterTube ${page.navTitle}`,
      description: page.seoDescription ?? page.description,
    },
  };
}

export default async function DetailPage({ params }) {
  const { slug } = await params;
  const page = detailPages[slug];

  if (!page) {
    notFound();
  }

  const relatedPages = page.related
    .map((relatedSlug) => detailPages[relatedSlug])
    .filter(Boolean);

  return (
    <>
      {appsOnPage[slug] ? <JsonLd data={softwareApplicationsJsonLd(appsOnPage[slug])} /> : null}
      <ScenicDetailPage page={page} relatedPages={relatedPages} />
    </>
  );
}
