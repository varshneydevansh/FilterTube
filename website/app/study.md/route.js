import { renderStudyMarkdown, markdownResponse } from "@/lib/markdown";

export const dynamic = "force-static";

export function GET() {
  return markdownResponse(renderStudyMarkdown(), "/study");
}
