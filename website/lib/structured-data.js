// Modest JSON-LD: a SoftwareApplication for each FilterTube app on the pages about it (all three on
// the homepage, Kids and Downloads), a WebSite entry on the homepage, and a FAQPage on /faq.
// No ratings or review counts; we don't have verified ones to cite. featureList says only what
// ships today (checked against site-facts.js `features`): ads are blocked on YouTube, YouTube Kids
// and YouTube Music, not on other websites.
import { SITE_URL, faqItems, links, oneLiner, release } from "@/data/site-facts";

const free = { "@type": "Offer", price: "0", priceCurrency: "USD" };
const publisher = { "@type": "Person", name: "Devansh Varshney", url: SITE_URL };

const featureList = [
  "Blocks YouTube ads",
  "Block YouTube channels and keywords",
  "Hide YouTube Shorts and comments",
  "Allow-only (Whitelist) mode for trusted channels",
  "Kids profiles with PINs and viewing limits",
  "Study mode",
  "Works on YouTube, YouTube Kids and YouTube Music",
  "No account; rules stay on your devices",
];

const apps = {
  ios: {
    name: "FilterTube for iPhone and iPad",
    operatingSystem: "iOS 17, iPadOS 17",
    applicationCategory: "UtilitiesApplication",
    url: `${SITE_URL}/ios`,
    downloadUrl: links.ios,
  },
  android: {
    name: "FilterTube for Android, tablets and Android TV",
    operatingSystem: "Android, Android TV",
    applicationCategory: "UtilitiesApplication",
    url: `${SITE_URL}/android`,
    downloadUrl: links.googlePlay,
  },
  extension: {
    name: "FilterTube browser extension",
    operatingSystem: "Chrome, Firefox, Edge, Opera",
    applicationCategory: "BrowserApplication",
    url: `${SITE_URL}/extension`,
    downloadUrl: links.chrome,
    license: "https://opensource.org/licenses/MIT",
  },
};

export const allApps = Object.keys(apps);

// `keys`: which apps the page is about, e.g. ["android"]; defaults to all three.
export function softwareApplicationsJsonLd(keys = allApps) {
  return {
    "@context": "https://schema.org",
    "@graph": keys.map((key) => ({
      "@type": "SoftwareApplication",
      ...apps[key],
      description: oneLiner,
      applicationSubCategory: "YouTube ad blocker and content filter",
      featureList,
      image: `${SITE_URL}/brand/logo.png`,
      softwareVersion: release.current,
      offers: free,
      author: publisher,
    })),
  };
}

// Tells search engines the site's name, so results show "FilterTube" rather than the domain.
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FilterTube",
    url: SITE_URL,
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
