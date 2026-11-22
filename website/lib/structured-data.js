// Modest JSON-LD: one SoftwareApplication per platform on the homepage and a FAQPage on /faq.
// No ratings or review counts; we don't have verified ones to cite.
import { SITE_URL, faqItems, links, oneLiner, release } from "@/data/site-facts";

const free = { "@type": "Offer", price: "0", priceCurrency: "USD" };
const publisher = { "@type": "Person", name: "Devansh Varshney", url: SITE_URL };

const apps = [
  {
    name: "FilterTube for iPhone and iPad",
    operatingSystem: "iOS 17, iPadOS 17",
    applicationCategory: "UtilitiesApplication",
    url: `${SITE_URL}/ios`,
    downloadUrl: links.ios,
  },
  {
    name: "FilterTube for Android, tablets and Android TV",
    operatingSystem: "Android, Android TV",
    applicationCategory: "UtilitiesApplication",
    url: `${SITE_URL}/android`,
    downloadUrl: links.googlePlay,
  },
  {
    name: "FilterTube browser extension",
    operatingSystem: "Chrome, Firefox, Edge, Opera",
    applicationCategory: "BrowserApplication",
    url: `${SITE_URL}/extension`,
    downloadUrl: links.chrome,
    license: "https://opensource.org/licenses/MIT",
  },
];

export function softwareApplicationsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": apps.map((app) => ({
      "@type": "SoftwareApplication",
      ...app,
      description: oneLiner,
      softwareVersion: release.current,
      offers: free,
      author: publisher,
    })),
  };
}

export function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
