import { notFound } from "next/navigation";

import {
  detailPages,
  platformOrder,
} from "@/components/route-content";
import { ScenicDetailPage } from "@/components/scenic-detail-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return platformOrder.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = detailPages[slug];

  if (!page) {
    return {};
  }

  return {
    title: page.navTitle,
    description: page.description,
    alternates: {
      canonical: `https://filtertube.in/${slug}`,
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
