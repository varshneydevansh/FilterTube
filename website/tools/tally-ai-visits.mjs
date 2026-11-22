#!/usr/bin/env node
// Tally AI crawler visits from exported Vercel logs.
//
//   vercel logs <deployment-url> --json > ai.log    (or download logs from the Vercel dashboard)
//   node tools/tally-ai-visits.mjs ai.log [more.log ...]
//
// Reads any text or JSON-lines file, finds the {"ft":"ai-visit",...} lines written by proxy.js
// (also when they are nested inside a log record's "message" field) and prints counts per day,
// bot and path, as a table and as CSV with --csv.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const csv = args.includes("--csv");
const files = args.filter((arg) => arg !== "--csv");
if (!files.length) {
  console.error("Usage: node tools/tally-ai-visits.mjs <log file> [...] [--csv]");
  process.exit(1);
}

const counts = new Map();
const pattern = /\{\\?"ft\\?":\\?"ai-visit\\?"[^}]*\}/g;

for (const file of files) {
  for (const match of readFileSync(file, "utf8").matchAll(pattern)) {
    let record;
    try {
      record = JSON.parse(match[0].replace(/\\"/g, '"'));
    } catch {
      continue;
    }
    const key = [record.day, record.bot, record.path].join("\t");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
}

const rows = [...counts].map(([key, count]) => [...key.split("\t"), count]).sort((a, b) =>
  a[0] === b[0] ? b[3] - a[3] : a[0].localeCompare(b[0]),
);

if (csv) {
  console.log("day,bot,path,visits");
  for (const row of rows) console.log(row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
} else if (!rows.length) {
  console.log("No ai-visit lines found.");
} else {
  for (const [day, bot, path, count] of rows) console.log(`${day}  ${bot.padEnd(18)} ${String(count).padStart(5)}  ${path}`);
  const byBot = new Map();
  for (const [, bot, , count] of rows) byBot.set(bot, (byBot.get(bot) ?? 0) + count);
  console.log("\nTotal by bot:");
  for (const [bot, count] of [...byBot].sort((a, b) => b[1] - a[1])) console.log(`  ${bot.padEnd(18)} ${count}`);
}
