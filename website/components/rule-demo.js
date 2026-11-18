"use client";

import { useId, useState } from "react";

import { Mascot } from "@/components/mascot";

// A schematic feed, not a screenshot: six made-up videos and what each kind of rule does to them.
const feed = [
  { id: "calc", title: "Calculus in 20 minutes", channel: "Maths with Meera", tint: "sage" },
  { id: "prank", title: "Ten prank fails in a row", channel: "Loud Lounge", tint: "rose", blockedBy: "the word “prank”" },
  { id: "short", title: "Wait for the end", channel: "Short, 0:21", tint: "lilac", blockedBy: "Shorts", short: true },
  { id: "chem", title: "Reaction basics, slowly", channel: "Chem Corner", tint: "sky" },
  { id: "drama", title: "This week’s drama, recapped", channel: "Gossip Hour", tint: "rose", blockedBy: "the channel Gossip Hour" },
  { id: "rain", title: "How rainforests make rain", channel: "Planet Notes", tint: "sage" },
];

const trusted = new Set(["Maths with Meera", "Chem Corner"]);
const builtFromTrusted = [
  { id: "parts", title: "Integration by parts, step by step", channel: "Maths with Meera", tint: "sage", added: true },
  { id: "bonds", title: "Why ionic bonds form", channel: "Chem Corner", tint: "sky", added: true },
];

const modes = {
  block: {
    label: "Blocklist",
    pose: "uljhanShrug",
    title: "Hide what you name, everywhere.",
    body: "Add a word, a channel, Shorts, comments or a whole category. FilterTube hides it on Home, in search, under the player and in Kids, and keeps everything else.",
    names: ["Words", "Channels", "Shorts", "Comments", "Categories"],
  },
  allow: {
    label: "Whitelist",
    pose: "kritiPoint",
    title: "Only what you allow shows up.",
    body: "Choose your channels and topics, and only they show. FilterTube also builds your feed from them, so the page is never empty.",
    names: ["Your channels", "Your topics", "A feed built from them"],
  },
};

function rowsFor(mode) {
  if (mode === "block") {
    return feed.map((item) => ({ ...item, hidden: Boolean(item.blockedBy), reason: item.blockedBy }));
  }
  const kept = feed.filter((item) => trusted.has(item.channel));
  const out = feed
    .filter((item) => !trusted.has(item.channel))
    .map((item) => ({ ...item, hidden: true, reason: "not on your Whitelist" }));
  return [...kept, ...builtFromTrusted, ...out];
}

export function RuleDemo() {
  const [mode, setMode] = useState("block");
  const panelId = useId();
  const copy = modes[mode];
  const rows = rowsFor(mode);
  const shown = rows.filter((row) => !row.hidden).length;
  const hidden = rows.length - shown;

  return (
    <div className="ft-rule-demo grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
      <div>
        <div aria-label="Mode" className="ft-segmented" role="radiogroup">
          {Object.entries(modes).map(([key, value]) => (
            <button
              aria-checked={mode === key}
              aria-controls={panelId}
              className="ft-segment"
              key={key}
              onClick={() => setMode(key)}
              role="radio"
              type="button"
            >
              {value.label}
            </button>
          ))}
        </div>

        <ul aria-label={`Example feed in ${copy.label} mode`} className="ft-feed mt-5" id={panelId}>
          {rows.map((row) => (
            <li className="ft-feed-row" data-added={row.added || undefined} data-hidden={row.hidden || undefined} data-short={row.short || undefined} key={row.id}>
              <span aria-hidden="true" className="ft-feed-thumb" data-tint={row.tint} />
              <span className="min-w-0">
                <span className="ft-feed-title">{row.title}</span>
                <span className="ft-feed-meta">{row.channel}</span>
              </span>
              <span className="ft-feed-tag">
                {row.hidden ? <>Kept out: {row.reason}</> : row.added ? "Added from your channels" : "Shows"}
              </span>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="mt-3 text-sm text-[var(--color-muted)]">
          {shown} showing, {hidden} kept out.
        </p>
      </div>

      <div className="ft-rule-copy flex flex-col justify-center">
        <div className="ft-paper flex items-end gap-5 rounded-[1.5rem] p-5 md:p-6">
          <Mascot className="h-28 w-auto shrink-0 md:h-32" key={copy.pose} pose={copy.pose} />
          <div>
            <h3 className="font-display text-3xl tracking-[-0.045em] text-[#1d1b18]">{copy.label}</h3>
            <p className="mt-1 font-editorial text-2xl leading-tight text-[#5d4a40]">{copy.title}</p>
          </div>
        </div>
        <p className="mt-5 max-w-[52ch] text-base leading-8 text-[var(--color-muted)]">{copy.body}</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={mode === "block" ? "What you can name" : "What you choose"}>
          {copy.names.map((name) => (
            <li className="ft-name-chip" key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
