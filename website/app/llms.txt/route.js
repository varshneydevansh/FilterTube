import { renderLlmsTxt, markdownResponse } from "@/lib/markdown";

export const dynamic = "force-static";

export function GET() {
  return markdownResponse(renderLlmsTxt(), null, "text/plain; charset=utf-8");
}
