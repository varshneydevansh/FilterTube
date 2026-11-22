import { renderLlmsFullTxt, markdownResponse } from "@/lib/markdown";

export const dynamic = "force-static";

export function GET() {
  return markdownResponse(renderLlmsFullTxt(), null, "text/plain; charset=utf-8");
}
