import { platformOrder } from "@/components/route-content";

const updated = {
  "": "2026-11-22",
  "/faq": "2026-11-22",
  "/compare": "2026-11-22",
  "/study": "2026-11-22",
  "/ios": "2026-11-20",
  "/downloads": "2026-11-20",
  "/privacy": "2026-11-22",
  "/terms": "2026-11-19",
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
