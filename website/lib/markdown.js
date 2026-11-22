// Markdown copies of the site's key pages, plus /llms.txt and /llms-full.txt (llmstxt.org).
// Every block here renders the same data the HTML page renders (data/site-facts.js,
// components/route-content.js, data/ios-guide.js), so the .md files never say anything a person
// can't read on the matching page. They are public, linked from llms.txt and from each page's
// <link rel="alternate" type="text/markdown">, and point back to the HTML page as canonical.

import {
  detailPages,
  homeAppCards,
  homeCapabilityCards,
  homeFaqItems,
  homeQuickSteps,
  homeTechnicalFeatures,
} from "@/components/route-content";
import { iosChecklist, iosFaqs, iosInstallSteps, iosPromises, iosSafetyPoints, iosStuck } from "@/data/ios-guide";
import {
  SITE_URL,
  audiences,
  comparisonIntro,
  comparisons,
  coverage,
  featureMatrix,
  matrixHeadline,
  matrixNote,
  matrixTools,
  faqGroups,
  features,
  filterTubeRow,
  links,
  oneLiner,
  platforms,
  privacyPoints,
  release,
  studyFacts,
  summary,
} from "@/data/site-facts";

const abs = (href) => (href.startsWith("/") ? `${SITE_URL}${href}` : href);
const linkList = (items) => items.map((item) => `[${item.label}](${abs(item.href)})`).join(" · ");
const bullets = (items) => items.map((item) => `- ${item}`).join("\n");
const cell = (text) => String(text).replace(/\|/g, "\\|");

export const markdownPages = [
  { path: "/index.md", html: "/", title: "Home", note: "What FilterTube is, platforms, features and common questions" },
  { path: "/faq.md", html: "/faq", title: "FAQ", note: "Buyer questions: keyword blocking, kids, allow-only, study, ads, privacy" },
  { path: "/compare.md", html: "/compare", title: "Compare", note: "FilterTube next to BlockTube, Unhook, TubeBlock, YouTube Kids, uBlock Origin, AdGuard and Brave" },
  { path: "/study.md", html: "/study", title: "Study mode", note: "How Study mode works and what 3.6.4 adds" },
  { path: "/ios.md", html: "/ios", title: "iPhone and iPad", note: "The native iOS app and the SideStore install guide" },
  { path: "/android.md", html: "/android", title: "Android, tablet and TV", note: "The Android app on Google Play, tablets and Android TV" },
  { path: "/extension.md", html: "/extension", title: "Browser extension", note: "Chrome, Firefox, Edge and Opera extension, open source (MIT)" },
  { path: "/kids.md", html: "/kids", title: "Kids", note: "Kids profiles, PINs, allow-only and parent controls" },
];

function header(title, htmlPath) {
  return `# ${title}\n\n> Markdown copy of ${SITE_URL}${htmlPath === "/" ? "" : htmlPath}. Same content as the web page.\n`;
}

function platformsBlock() {
  return platforms
    .map((platform) => `- **${platform.name}:** ${platform.detail} ${linkList(platform.installs)}`)
    .join("\n");
}

function coverageBlock() {
  return coverage.map((item) => `- **${item.where}:** ${item.covers}`).join("\n");
}

function featuresBlock() {
  return features.map((feature) => `- **${feature.title}:** ${feature.body}`).join("\n");
}

function faqBlock(level = "##") {
  return faqGroups
    .map((group) => {
      const items = group.items
        .map((item) => {
          const extra = item.links?.length ? `\n\n${linkList(item.links)}` : "";
          return `${level}# ${item.q}\n\n${item.a}${extra}`;
        })
        .join("\n\n");
      return `${level} ${group.title}\n\n${items}`;
    })
    .join("\n\n");
}

function compareBlock(level = "##") {
  const rows = [filterTubeRow, ...comparisons]
    .map((tool) => `| ${cell(tool.name)} | ${cell(tool.madeFor)} | ${cell(tool.runsOn)} | ${cell(tool.price)} |`)
    .join("\n");
  const table = `| Tool | Made for | Runs on | Price |\n| --- | --- | --- | --- |\n${rows}`;
  const notes = comparisons
    .map((tool) => `${level}# ${tool.name}\n\n- **What it's good at:** ${tool.goodAt}\n- **What FilterTube adds:** ${tool.adds}`)
    .join("\n\n");
  const matrix =
    `| Feature | ${matrixTools.join(" | ")} |\n| --- |${matrixTools.map(() => " --- |").join("")}\n` +
    featureMatrix.map((row) => `| ${cell(row.feature)} | ${row.cells.map(cell).join(" | ")} |`).join("\n");
  return `${comparisonIntro}\n\n${level} Feature by feature\n\n**${matrixHeadline}**\n\n${matrix}\n\n${matrixNote}\n\n${level} What each tool is for\n\n${table}\n\n${notes}`;
}

function studyBlock(level = "##") {
  const steps = studyFacts.steps.map((step, index) => `${index + 1}. **${step.title}.** ${step.body}`).join("\n");
  return `${studyFacts.intro}\n\n${level} How it works\n\n${steps}\n\n${level} Also in Study\n\n${bullets(studyFacts.extras)}\n\n${level} Coming in ${release.next}\n\n${bullets(studyFacts.coming)}`;
}

function detailBlock(page) {
  const parts = [page.description];
  if (page.featureCards?.length) {
    parts.push(page.featureCards.map((card) => `## ${card.title}${card.status ? ` (${card.status})` : ""}\n\n${card.body}`).join("\n\n"));
  }
  if (page.exploreGroups?.length) {
    parts.push(
      `## ${page.exploreTitle ?? "Details"}\n\n` +
        page.exploreGroups.map((group) => `### ${group.title}\n\n${group.summary}\n\n${bullets(group.points)}`).join("\n\n"),
    );
  }
  if (page.milestones?.length) {
    parts.push(`## ${page.milestoneTitle}\n\n${page.milestoneIntro}\n\n${bullets(page.milestones)}`);
  }
  return parts.join("\n\n");
}

const installLinks = {
  android: [{ label: "Google Play", href: links.googlePlay }, { label: "TV APK on GitHub", href: links.githubReleases }],
  extension: [
    { label: "Chrome Web Store", href: links.chrome },
    { label: "Firefox Add-ons", href: links.firefox },
    { label: "Edge Add-ons", href: links.edge },
    { label: "Opera (ZIP on GitHub)", href: links.githubReleases },
  ],
  kids: [{ label: "Google Play", href: links.googlePlay }, { label: "iPhone and iPad", href: links.ios }, { label: "Browser extension", href: links.downloads }],
};

export function renderDetailMarkdown(slug) {
  const page = detailPages[slug];
  const title = `FilterTube: ${page.navTitle}`;
  const install = installLinks[slug] ? `\n\n**Install:** ${linkList(installLinks[slug])}` : "";
  return `${header(title, `/${slug}`)}\n${page.status}${install}\n\n${detailBlock(page)}\n`;
}

export function renderIosMarkdown() {
  const page = detailPages.ios;
  const steps = iosInstallSteps
    .map((step) => `${step.number}. **${step.title}** (${step.where}). ${step.body}`)
    .join("\n");
  return `${header("FilterTube for iPhone and iPad", "/ios")}
${page.description}

**Install:** [SideStore guide](${links.ios}) · [SideStore / AltStore source](${links.iosSource})

${bullets(iosPromises)}

${detailBlock(page)}

## Install FilterTube on iPhone and iPad

### Before you start

${bullets(iosChecklist.map((item) => item.text))}

### Install steps

${steps}

### Is it safe?

${iosSafetyPoints.map((point) => `- **${point.title}.** ${point.body}`).join("\n")}

### If you get stuck

${iosStuck.map((item) => `- **${item.q}.** ${item.a}`).join("\n")}

### Questions

${iosFaqs.map((item) => `- **${item.q}** ${item.a}`).join("\n")}
`;
}

export function renderIndexMarkdown() {
  return `${header("FilterTube", "/")}
${summary}

Current version: ${release.current} (${release.currentDate}). ${release.next} is coming soon.

## Get FilterTube

${homeAppCards.map((card) => `### ${card.title}\n\n${card.body} [${card.action}](${abs(card.href)})`).join("\n\n")}

${platformsBlock()}

## Start small

${homeQuickSteps.map(([number, title, body]) => `${number}. **${title}.** ${body}`).join("\n")}

## What FilterTube does

${homeCapabilityCards.map((card) => `### ${card.title}\n\n${card.description}\n\n${bullets(card.points)}`).join("\n\n")}

## Every feature

${homeTechnicalFeatures.map((item) => `- **${item.title}${item.status ? ` (${item.status})` : ""}:** ${item.description}${item.detail ? ` ${item.detail}` : ""}`).join("\n")}

## Common questions

${homeFaqItems.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}

More: [FAQ](${SITE_URL}/faq) · [Compare](${SITE_URL}/compare) · [Study mode](${SITE_URL}/study) · [Privacy](${links.privacy})
`;
}

export function renderFaqMarkdown() {
  return `${header("FilterTube FAQ", "/faq")}\n${oneLiner}\n\n${faqBlock()}\n`;
}

export function renderCompareMarkdown() {
  return `${header("FilterTube compared with other YouTube blockers", "/compare")}\n${compareBlock()}\n`;
}

export function renderStudyMarkdown() {
  return `${header("FilterTube Study mode", "/study")}\n${studyBlock()}\n`;
}

export function renderLlmsTxt() {
  const pages = markdownPages
    .map((page) => `- [${page.title}](${SITE_URL}${page.path}): ${page.note}`)
    .join("\n");
  return `# FilterTube

> ${summary}

Current version: ${release.current} (${release.currentDate}); ${release.next} is coming soon. FilterTube is independent and not affiliated with Google or YouTube.

## Who it's for

${audiences.map((item) => `- **${item.title}:** ${item.body}`).join("\n")}

## YouTube, YouTube Kids and YouTube Music

${coverageBlock()}

## Features

${featuresBlock()}

## Platforms and install links

${platformsBlock()}

## Privacy

${bullets(privacyPoints)}

## Pages

${pages}

## Optional

- [Full text for AI assistants](${SITE_URL}/llms-full.txt): every page above in one file
- [Downloads](${links.downloads}): every store and direct build
- [Privacy policy](${links.privacy})
- [Extension source and docs](${links.docs})
`;
}

export function renderLlmsFullTxt() {
  return `# FilterTube (full text)

> ${summary}

Current version: ${release.current} (${release.currentDate}); ${release.next} is coming soon. FilterTube is independent and not affiliated with Google or YouTube.

## Who it's for

${audiences.map((item) => `- **${item.title}:** ${item.body}`).join("\n")}

## YouTube, YouTube Kids and YouTube Music

${coverageBlock()}

## Features

${featuresBlock()}

## Platforms and install links

${platformsBlock()}

## Privacy

${bullets(privacyPoints)}

## Frequently asked questions

${faqBlock("###")}

## Compared with other tools

${compareBlock("###")}

## Study mode

${studyBlock("###")}

## Sources

${markdownPages.map((page) => `- ${SITE_URL}${page.html === "/" ? "" : page.html} (Markdown: ${SITE_URL}${page.path})`).join("\n")}
`;
}

export function markdownResponse(body, htmlPath, contentType = "text/markdown; charset=utf-8") {
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
  };
  if (htmlPath) headers.Link = `<${SITE_URL}${htmlPath}>; rel="canonical"`;
  return new Response(body, { headers });
}
