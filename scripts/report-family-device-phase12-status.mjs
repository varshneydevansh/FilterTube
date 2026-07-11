#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PLAN = 'docs/audit/FILTERTUBE_XENDER_STYLE_FAMILY_DEVICE_MAP_PLAN_2026-07-07.md';
const PHASE_START = '### Phase 12 - True Nearby Device Discovery Design';
const PHASE_END = '## Implemented UI Slice';

function parseArgs(argv) {
  const args = {
    plan: DEFAULT_PLAN,
    next: false,
    requireComplete: false,
    requireReleaseComplete: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--next') {
      args.next = true;
      continue;
    }
    if (arg === '--require-complete') {
      args.requireComplete = true;
      continue;
    }
    if (arg === '--require-release-complete') {
      args.requireReleaseComplete = true;
      continue;
    }
    if (arg === '--plan') {
      args.plan = argv[index + 1] || '';
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function phaseBlock(markdown) {
  const start = markdown.indexOf(PHASE_START);
  const end = markdown.indexOf(PHASE_END, start);
  if (start < 0 || end < 0) {
    throw new Error('Could not find Phase 12 block');
  }
  return markdown.slice(start, end);
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function extractItems(block) {
  const lines = block.split('\n');
  const items = [];
  let section = 'Phase 12';
  let current = null;
  lines.forEach((line) => {
    const heading = line.match(/^####+\s+(.+)$/);
    if (heading) {
      section = normalize(heading[1]);
      return;
    }
    const item = line.match(/^-\s+\[([ xX])\]\s+(.+)$/);
    if (item) {
      current = {
        section,
        done: item[1].toLowerCase() === 'x',
        title: normalize(item[2]),
        detail: []
      };
      items.push(current);
      return;
    }
    if (current && /^\s{6,}\S/.test(line)) {
      const text = normalize(line);
      if (
        !/:$/.test(current.title) &&
        !/[.!?]$/.test(current.title) &&
        !/^(Skills to use:|Proof needed:|Current status:)/i.test(text)
      ) {
        current.title = normalize(`${current.title} ${text}`);
        return;
      }
      current.detail.push(text);
      return;
    }
    if (line.trim() === '') {
      current = null;
    }
  });
  return items;
}

function bySection(items) {
  const sections = new Map();
  items.forEach((item) => {
    const existing = sections.get(item.section) || { done: 0, pending: 0, total: 0 };
    existing.total += 1;
    if (item.done) existing.done += 1;
    else existing.pending += 1;
    sections.set(item.section, existing);
  });
  return sections;
}

function detailLine(item, prefix) {
  const normalizedPrefix = String(prefix || '').toLowerCase();
  const start = item.detail.findIndex((line) => line.toLowerCase().startsWith(normalizedPrefix));
  if (start < 0) return '';
  const parts = [];
  for (let index = start; index < item.detail.length; index += 1) {
    const line = item.detail[index];
    if (index !== start && /^(Skills to use:|Proof needed:|Current status:)/i.test(line)) break;
    parts.push(line);
  }
  return normalize(parts.join(' '));
}

function pendingKind(item) {
  const text = normalize(`${item.title} ${item.detail.join(' ')}`).toLowerCase();
  if (item.section.includes('Phase 12C - Xender-Style Map UI')) {
    return 'release';
  }
  if (
    text.includes('future behavior only') ||
    text.includes('future discovery') ||
    text.includes('future provider') ||
    text.includes('separate future') ||
    text.includes('unpaired discovery is not implemented')
  ) {
    return 'future';
  }
  return 'release';
}

function implementationState(item) {
  if (item.done) return 'complete';
  const currentStatus = detailLine(item, 'Current status:').toLowerCase();
  const text = normalize(`${item.title} ${item.detail.join(' ')}`).toLowerCase();
  if (pendingKind(item) === 'future') return 'future';
  if (
    currentStatus.includes('now renders') ||
    currentStatus.includes('now carry') ||
    currentStatus.includes('exist for the current release boundary') ||
    currentStatus.includes('css collapses') ||
    currentStatus.includes('selects parent-control mode') ||
    currentStatus.includes('call `selectnanahtrustedmapdevice()`') ||
    currentStatus.includes('route to the existing') ||
    currentStatus.includes('still needs installed') ||
    currentStatus.includes('proof is still required') ||
    text.includes('installed proof') ||
    text.includes('real two-device proof')
  ) {
    return 'implemented-needs-proof';
  }
  return 'release-work';
}

function implementationSummary(items) {
  return items.reduce((summary, item) => {
    const state = implementationState(item);
    summary[state] = (summary[state] || 0) + 1;
    return summary;
  }, {});
}

function printPendingGroup(title, items) {
  if (!items.length) return;
  console.log(title);
  items.forEach((item) => {
    console.log(`- ${item.section}: ${item.title}`);
    const currentStatus = detailLine(item, 'Current status:');
    if (currentStatus) console.log(`  ${currentStatus}`);
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const planPath = path.resolve(args.plan);
  const markdown = fs.readFileSync(planPath, 'utf8');
  const block = phaseBlock(markdown);
  const items = extractItems(block);
  const pending = items.filter((item) => !item.done);
  const done = items.filter((item) => item.done);
  const sections = bySection(items);
  const releasePending = pending.filter((item) => pendingKind(item) === 'release');
  const futurePending = pending.filter((item) => pendingKind(item) === 'future');
  const stateSummary = implementationSummary(items);

  console.log('Family Devices Phase 12 status');
  console.log(`Plan: ${args.plan}`);
  console.log(`Items: ${items.length}`);
  console.log(`Done: ${done.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log(`Implemented but needs proof: ${stateSummary['implemented-needs-proof'] || 0}`);
  console.log(`Future/provider work: ${stateSummary.future || 0}`);
  console.log(`Release implementation work still open: ${stateSummary['release-work'] || 0}`);
  console.log('');
  console.log('By section:');
  sections.forEach((counts, section) => {
    console.log(`- ${section}: ${counts.done}/${counts.total} done, ${counts.pending} pending`);
  });

  if (pending.length) {
    console.log('');
    console.log(`Release-pending requirements: ${releasePending.length}`);
    printPendingGroup('Release-pending requirements:', releasePending);
    if (futurePending.length) {
      console.log('');
      console.log(`Future discovery/provider requirements: ${futurePending.length}`);
      printPendingGroup('Future discovery/provider requirements:', futurePending);
    }
  } else {
    console.log('');
    console.log('All Phase 12 checklist items are marked complete.');
  }

  if (args.next && pending.length) {
    const next = releasePending[0] || futurePending[0];
    console.log('');
    console.log('Next Phase 12 item:');
    console.log(`- Section: ${next.section}`);
    console.log(`- Requirement: ${next.title}`);
    const proofLines = next.detail.filter((line) => /Proof needed:|Current status:|Skills to use:/i.test(line));
    if (proofLines.length) {
      console.log('- Supporting lines:');
      proofLines.forEach((line) => console.log(`  - ${line}`));
    }
  }

  console.log('');
  console.log('Release boundary: the Home Bridge and companion-assisted nearby picker need installed visual/two-device evidence; the extension does not scan subnets, and zero-install native discovery remains future work.');

  if (args.requireComplete && pending.length) {
    process.exitCode = 1;
  }
  if (args.requireReleaseComplete && releasePending.length) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(`Family Devices Phase 12 status failed: ${error.message}`);
  process.exit(1);
}
