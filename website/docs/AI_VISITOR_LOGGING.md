# AI visitor counting on filtertube.in

On by default since 22 November 2026, as the owner decided. The privacy policy (section 12) says so.

## What it counts

`proxy.js` (Next.js 16 proxy, formerly middleware) writes one line to the Vercel function
logs for each request from a known AI crawler:

```json
{"ft":"ai-visit","bot":"ClaudeBot","path":"/faq.md","day":"2026-11-22"}
```

- **Kept:** the bot's name from a fixed list, the path (no query string, 200 characters at most) and the UTC day.
- **Not kept:** IP address, the full user-agent string, cookies, referrer, query strings, anything about people.
- **Who it runs for:** the matcher has a `user-agent` header condition, so the proxy only runs when the
  user-agent names an AI crawler. People's visits never reach it and cost no function call.
  Assets (`/_next`, images, videos) are excluded.

Bots counted: OAI-SearchBot, ChatGPT-User, GPTBot, Claude-SearchBot, Claude-User, ClaudeBot,
anthropic-ai, Perplexity-User, PerplexityBot, Google-CloudVertexBot, Gemini-Deep-Research,
Applebot (and Applebot-Extended), Amazonbot, meta-externalagent, Bytespider, CCBot, cohere-ai,
DuckAssistBot, MistralAI-User, YouBot.

Google-Extended is only a robots.txt token. Gemini's training opt-in uses it, but Google crawls with
Googlebot, which we don't count: it can't be told apart from ordinary search crawling.

## Why logs and not a database

There is no store we can use without adding a paid service or keys. Vercel KV/Upstash, Edge Config writes and
Web Analytics custom events from the server all need either a new integration or a paid plan.
Function logs are free and need nothing new.

Caveat: Vercel keeps runtime logs for a short time, about an hour on Hobby and longer on paid plans.
To build a history, export them regularly:

```sh
vercel logs https://filtertube.in --json > logs/ai-$(date +%F).log   # or download from the dashboard
node tools/tally-ai-visits.mjs logs/*.log          # table per day, bot and path
node tools/tally-ai-visits.mjs logs/*.log --csv    # CSV
```

To keep everything automatically later, add a Vercel Log Drain to any log store and filter for
`"ft":"ai-visit"`. No code change is needed.

## Turning it off

Set the environment variable `AI_VISIT_LOG=off` in Vercel and redeploy. To remove it completely,
delete `proxy.js`, and remove the paragraph in the privacy policy's website section.
