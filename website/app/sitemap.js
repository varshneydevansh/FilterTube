import { platformOrder } from "@/components/route-content";

const updated = {
  "": "2026-11-23",
  "/faq": "2026-11-23",
  "/compare": "2026-11-23",
  "/study": "2026-11-23",
  "/ios": "2026-11-23",
  "/downloads": "2026-11-23",
  "/privacy": "2026-11-23",
  "/terms": "2026-11-23",
  "/extension": "2026-11-23",
  "/mobile": "2026-11-23",
  "/ipados": "2026-11-23",
  "/android": "2026-11-23",
  "/tv": "2026-11-23",
  "/android-tv": "2026-11-23",
  "/fire-tv": "2026-11-23",
  "/kids": "2026-11-23",
  "/ml-ai": "2026-11-23",
};

const routes = [
  "",
  "/faq",
  "/compare",
  "/study",
  "/downloads",
  "/privacy",
  "/terms",
  ...platformOrder.map((slug) => `/${slug}`),
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `https://filtertube.in${route}`,
    lastModified: updated[route] ?? "2026-11-18",
  }));
}
