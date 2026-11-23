// Everyone may crawl every public page and asset, including /_next/ CSS and JS, images and videos,
// which Google needs to render pages. AI crawlers are named explicitly so it is clear they are
// welcome: /llms.txt and the .md copies of each page are written for them.
//
// Disallowed: only files that are not meant as web pages.
// - /ios/README.md is a maintainer note about the SideStore source file. It is in public/ only so
//   it sits beside source.json (which stays crawlable; SideStore and AltStore fetch it).
//
// Not disallowed on purpose: the .md copies (/faq.md and the rest) duplicate their HTML pages, but
// each sends a `Link: <…>; rel="canonical"` header pointing at its page (lib/markdown.js). Blocking
// them here would hide that header from search engines, so they stay open.
//
// This site has no API routes, preview routes or test pages to block. The only noindex is the 404 page.
const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

const notPages = ["/ios/README.md"];

export default function robots() {
  return {
    rules: [
      { userAgent: aiCrawlers, allow: "/", disallow: notPages },
      { userAgent: "*", allow: "/", disallow: notPages },
    ],
    sitemap: "https://filtertube.in/sitemap.xml",
  };
}
