// Counts visits from known AI crawlers, by bot name, path and day. Nothing else.
//
// What a log line holds: {"ft":"ai-visit","bot":"GPTBot","path":"/faq","day":"2026-11-22"}.
// No IP address, no full user-agent string, no cookies, no query string, no referrer.
// Lines go to the Vercel function logs; tools/tally-ai-visits.mjs turns an export into counts.
// docs/AI_VISITOR_LOGGING.md explains the plan. Set AI_VISIT_LOG=off in Vercel to stop it.
//
// The matcher below only runs this for requests whose user-agent names an AI crawler, so
// ordinary visitors never reach this code and never cost a function call.
import { NextResponse } from "next/server";

// Order matters: more specific names first (ChatGPT-User before GPT matches, etc.).
export const AI_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "anthropic-ai",
  "Perplexity-User",
  "PerplexityBot",
  "Google-CloudVertexBot",
  "Gemini-Deep-Research",
  "Applebot-Extended",
  "Applebot",
  "Amazonbot",
  "meta-externalagent",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "MistralAI-User",
  "YouBot",
];

export function botName(userAgent = "") {
  const ua = userAgent.toLowerCase();
  return AI_BOTS.find((name) => ua.includes(name.toLowerCase())) ?? null;
}

export function proxy(request) {
  if (process.env.AI_VISIT_LOG !== "off") {
    const bot = botName(request.headers.get("user-agent") ?? "");
    if (bot) {
      console.log(
        JSON.stringify({
          ft: "ai-visit",
          bot,
          path: request.nextUrl.pathname.slice(0, 200),
          day: new Date().toISOString().slice(0, 10),
        }),
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      // Pages, .md copies and llms.txt; never build assets, images or videos.
      source: "/((?!_next/|apps/|brand/|browsers/|community/|mascots/|videos/|favicon|icon).*)",
      has: [
        {
          type: "header",
          key: "user-agent",
          value:
            ".*(OAI-SearchBot|ChatGPT-User|GPTBot|Claude-SearchBot|Claude-User|ClaudeBot|anthropic-ai|Perplexity-User|PerplexityBot|Google-CloudVertexBot|Gemini-Deep-Research|Applebot|Amazonbot|meta-externalagent|Bytespider|CCBot|cohere-ai|DuckAssistBot|MistralAI-User|YouBot).*",
        },
      ],
    },
  ],
};
