// Everyone may crawl. AI crawlers are named explicitly so it is clear they are welcome:
// /llms.txt and the .md copies of each page are written for them.
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

export default function robots() {
  return {
    rules: [
      { userAgent: aiCrawlers, allow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: "https://filtertube.in/sitemap.xml",
  };
}
