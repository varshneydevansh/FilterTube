import { platformOrder } from "@/components/route-content";

const routes = ["", "/privacy", "/terms", ...platformOrder.map((slug) => `/${slug}`)];

export default function sitemap() {
  return routes.map((route) => ({
    url: `https://filtertube.in${route}`,
    lastModified: "2026-05-04",
  }));
}
