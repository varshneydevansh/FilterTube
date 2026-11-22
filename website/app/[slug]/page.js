import { notFound } from "next/navigation";

import {
  detailPages,
  platformOrder,
} from "@/components/route-content";
import { ScenicDetailPage } from "@/components/scenic-detail-page";

export const dynamicParams = false;

// Pages with a Markdown copy at /<slug>.md (see lib/markdown.js).
const markdownSlugs = new Set(["android", "extension", "kids"]);

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
    description: page.description,
    alternates: {
      canonical: `https://filtertube.in/${slug}`,
      ...(markdownSlugs.has(slug) ? { types: { "text/markdown": `https://filtertube.in/${slug}.md` } } : {}),
    },
    openGraph: {
      title: `FilterTube ${page.navTitle}`,
      description: page.description,
      url: `https://filtertube.in/${slug}`,
    },
    twitter: {
      title: `FilterTube ${page.navTitle}`,
      description: page.description,
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

  return <ScenicDetailPage page={page} relatedPages={relatedPages} />;
}
