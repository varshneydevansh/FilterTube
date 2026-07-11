#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PLAN = 'docs/audit/FILTERTUBE_XENDER_STYLE_FAMILY_DEVICE_MAP_PLAN_2026-07-07.md';
const DEFAULT_EVIDENCE_DIR = 'docs/audit/evidence/family-devices-2026-07-08';

const MINIMUM_ROWS = [
  'map-no-protected-profile',
  'map-one-protected-profile',
  'map-nearby-discovery-active',
  'map-nearby-pairing-gated',
  'map-verified-live-session',
  'map-trusted-device-saved',
  'protected-receive-only-surface',
  'protected-child-pin-not-admin',
  'viewport-mobile'
];

const MINIMUM_STATIC_PROOFS = [
  {
    id: 'no-provider-no-rule-performance',
    pattern: '- [x] Check no-provider/no-rule performance:',
    label: 'No-provider/no-rule performance proof remains checked in Phase 11'
  }
];

const CASE_DETAILS = {
  'map-no-protected-profile': {
    profile: 'parent/master',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'My Devices & Family offers personal profile sync without a PIN. Choosing Sync My Devices opens code/QR pairing from any location and the optional configured nearby-device picker; family control stays separate.',
    actual: 'Installed dashboard matched the no-protected-profile state.'
  },
  'map-one-protected-profile': {
    profile: 'parent/master',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'Family Devices shows one protected profile and asks the parent to pair a protected device.',
    actual: 'Installed dashboard matched the one-protected-profile state.'
  },
  'map-nearby-discovery-active': {
    profile: 'parent/master',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'Family Devices shows Looking nearby, Stop finding, and an unpaired row whose only next action is Pair nearby device.',
    actual: 'Installed dashboard matched the active nearby-discovery state.'
  },
  'map-nearby-pairing-gated': {
    profile: 'parent/master + protected device',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'The short code reaches the protected device, both devices show a safety phrase, and no trust or settings are sent before phrase confirmation.',
    actual: 'Installed devices kept nearby pairing gated behind matching phrase confirmation.'
  },
  'map-verified-live-session': {
    profile: 'parent/master',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'Family Devices shows a verified live pairing session only after the safety phrase is matched.',
    actual: 'Installed dashboard matched the verified live-session state.'
  },
  'map-trusted-device-saved': {
    profile: 'parent/master',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'Family Devices shows a saved trusted device without treating it as a live connection.',
    actual: 'Installed dashboard matched the trusted-device-saved state.'
  },
  'protected-receive-only-surface': {
    profile: 'protected child',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'Protected Accounts & Sync is receive-only and does not expose parent trust or send-update controls.',
    actual: 'Installed dashboard matched the protected receive-only state.'
  },
  'protected-child-pin-not-admin': {
    profile: 'protected child',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: 'A child profile PIN can switch into the protected profile but cannot unlock parent/admin controls.',
    actual: 'Installed dashboard kept parent/admin controls locked from the child PIN.'
  },
  'viewport-mobile': {
    profile: 'parent/master',
    visualExt: 'png',
    requiredArtifacts: ['visual'],
    expected: 'Family Devices remains readable and usable at mobile or narrow width without clipped map actions.',
    actual: 'Installed dashboard matched the mobile/narrow viewport layout expectation.'
  }
};

function parseArgs(argv) {
  const args = {
    plan: DEFAULT_PLAN,
    evidenceDir: DEFAULT_EVIDENCE_DIR,
    requireMinimumPass: false,
    next: false,
    browser: 'Chrome / macOS',
    os: 'macOS',
    version: '3.3.5'
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--require-minimum-pass') {
      args.requireMinimumPass = true;
      continue;
    }
    if (arg === '--next') {
      args.next = true;
      continue;
    }
    if (arg === '--plan') {
      args.plan = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--evidence-dir') {
      args.evidenceDir = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--browser') {
      args.browser = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--os') {
      args.os = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--version') {
      args.version = argv[index + 1] || '';
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function normalizeCell(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripBackticks(value) {
  return normalizeCell(value).replace(/^`|`$/g, '');
}

function extractManualLogRows(markdown) {
  const start = markdown.indexOf('| Date | Browser / OS | Case ID | Result | Screenshot / note | Snapshot |');
  const end = markdown.indexOf('#### Phase 11 Sign-Off', start);
  if (start < 0 || end < 0) {
    throw new Error('Could not find Manual Evidence Log table');
  }
  const block = markdown.slice(start, end);
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .filter((line) => !line.includes('---'))
    .slice(1)
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map(normalizeCell);
      const caseIdMatch = cells[2]?.match(/`([^`]+)`/);
      const caseId = caseIdMatch ? caseIdMatch[1] : stripBackticks(cells[2]);
      return {
        date: cells[0] || '',
        browserOs: cells[1] || '',
        caseId,
        result: stripBackticks(cells[3] || 'pending').toLowerCase(),
        note: cells[4] || '',
        snapshot: cells[5] || ''
      };
    })
    .filter((row) => row.caseId);
}

function listEvidenceFiles(evidenceDir) {
  try {
    return fs.readdirSync(evidenceDir).sort();
  } catch (_) {
    return [];
  }
}

function readJsonIfPossible(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function summarizeJsonEvidence(caseId, jsonFiles, evidenceDir) {
  return jsonFiles.map((file) => {
    const payload = readJsonIfPossible(path.join(evidenceDir, file));
    const hasCopiedEvidence = payload?.copiedMapEvidence?.schema === 'filtertube_family_devices_manual_evidence';
    const packetCaseId = payload?.caseId;
    const packetResult = String(payload?.result || '').trim().toLowerCase();
    const validPacket = packetCaseId === caseId && hasCopiedEvidence && packetResult === 'pass';
    return {
      file,
      packetCaseId,
      packetResult,
      hasCopiedEvidence,
      validPacket
    };
  });
}

function summarizeEvidence(row, files, evidenceDir) {
  const prefix = `${row.caseId}.`;
  const matching = files.filter((file) => file.startsWith(prefix));
  const json = matching.filter((file) => /\.json$/i.test(file));
  const jsonPackets = summarizeJsonEvidence(row.caseId, json, evidenceDir);
  return {
    visuals: matching.filter((file) => /\.(png|mp4)$/i.test(file)),
    json,
    jsonPackets,
    validJsonPackets: jsonPackets.filter((packet) => packet.validPacket),
    notes: matching.filter((file) => /\.md$/i.test(file))
  };
}

function getRequiredArtifacts(caseId) {
  return CASE_DETAILS[caseId]?.requiredArtifacts || ['visual', 'json'];
}

function getMissingArtifacts(caseId, evidence) {
  const required = getRequiredArtifacts(caseId);
  const missing = [];
  if (required.includes('visual') && !evidence.visuals.length) {
    missing.push('visual');
  }
  if (required.includes('json') && !evidence.json.length) {
    missing.push('json');
  } else if (required.includes('json') && !evidence.validJsonPackets?.length) {
    missing.push('valid-pass-json');
  }
  return missing;
}

function getStaticProofs(markdown) {
  return MINIMUM_STATIC_PROOFS.map((proof) => ({
    ...proof,
    result: markdown.includes(proof.pattern) ? 'pass' : 'missing'
  }));
}

function slugForRuntime(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'runtime';
}

function buildRuntimeSlug(browser, os) {
  const browserSlug = slugForRuntime(browser);
  const osSlug = slugForRuntime(os);
  if (!osSlug || browserSlug.endsWith(osSlug)) {
    return browserSlug;
  }
  return `${browserSlug}-${osSlug}`;
}

function shellQuote(value) {
  const text = String(value || '');
  if (/^[A-Za-z0-9_./:@=-]+$/.test(text)) {
    return text;
  }
  return `'${text.replace(/'/g, `'\\''`)}'`;
}

function printNextCaptureCommand(args, rows, minimum, files) {
  const byCase = new Map(rows.map((row) => [row.caseId, row]));
  const nextMinimum = minimum.find((row) => row.result !== 'pass');
  const nextAny = rows.find((row) => row.result !== 'pass');
  const nextCaseId = nextMinimum?.caseId || nextAny?.caseId;
  if (!nextCaseId) {
    console.log('');
    console.log('Next capture: none. Every Manual Evidence Log row is marked pass.');
    return;
  }

  const existingRow = byCase.get(nextCaseId);
  const evidence = existingRow
    ? summarizeEvidence(existingRow, files, args.evidenceDir)
    : { visuals: [], json: [], jsonPackets: [], validJsonPackets: [] };
  const detail = CASE_DETAILS[nextCaseId] || {
    profile: 'parent/master',
    visualExt: 'png',
    requiredArtifacts: ['visual', 'json'],
    expected: `Installed dashboard matches the ${nextCaseId} expected state.`,
    actual: `Installed dashboard matched the ${nextCaseId} state.`
  };
  const runtime = buildRuntimeSlug(args.browser, args.os);
  const screenshot = path.join(args.evidenceDir, `${nextCaseId}.${runtime}.${detail.visualExt}`);
  const rawEvidence = path.join(args.evidenceDir, `raw-${nextCaseId}.${runtime}.json`);
  const outPacket = path.join(args.evidenceDir, `${nextCaseId}.${runtime}.json`);
  const visualFileName = path.basename(screenshot);
  const visualAutoAttach = evidence.visuals.includes(visualFileName);

  console.log('');
  console.log('Next capture:');
  console.log(`- Case: ${nextCaseId}`);
  console.log(`- Result now: ${existingRow?.result || 'missing-row'}`);
  console.log(`- Current artifacts: ${evidence.visuals.length} visual, ${evidence.json.length} json`);
  console.log(`- Screenshot/video: ${screenshot}`);
  console.log(`- Raw Copy/Download evidence: ${rawEvidence}`);
  console.log(`- Packet output: ${outPacket}`);
  console.log(`- Importer visual auto-attach: ${visualAutoAttach ? `yes (${visualFileName})` : 'no; save the matching screenshot/video first or pass --screenshot'}`);
  console.log('');
  console.log('One-command import after using Copy evidence in the dashboard:');
  console.log('npm run audit:family-devices:import -- \\');
  console.log('  --clipboard \\');
  console.log(`  --browser ${shellQuote(args.browser)} \\`);
  console.log(`  --os ${shellQuote(args.os)} \\`);
  console.log(`  --version ${shellQuote(args.version)}`);
  console.log('');
  console.log('One-command import after using Download evidence in the dashboard:');
  console.log('npm run audit:family-devices:import -- \\');
  console.log(`  --browser ${shellQuote(args.browser)} \\`);
  console.log(`  --os ${shellQuote(args.os)} \\`);
  console.log(`  --version ${shellQuote(args.version)}`);
  console.log('');
  console.log('Shortcut packet command after capturing raw evidence:');
  console.log('node scripts/create-family-device-evidence-packet.mjs \\');
  console.log(`  --evidence ${shellQuote(rawEvidence)} \\`);
  console.log(`  --browser ${shellQuote(args.browser)} \\`);
  console.log(`  --os ${shellQuote(args.os)} \\`);
  console.log(`  --version ${shellQuote(args.version)}`);
  console.log('');
  console.log('Explicit packet command if the raw evidence has no suggestedCaseId:');
  console.log('node scripts/create-family-device-evidence-packet.mjs \\');
  console.log(`  --case ${shellQuote(nextCaseId)} \\`);
  console.log(`  --evidence ${shellQuote(rawEvidence)} \\`);
  console.log(`  --screenshot ${shellQuote(screenshot)} \\`);
  console.log(`  --out ${shellQuote(outPacket)} \\`);
  console.log(`  --browser ${shellQuote(args.browser)} \\`);
  console.log(`  --os ${shellQuote(args.os)} \\`);
  console.log(`  --version ${shellQuote(args.version)} \\`);
  console.log(`  --profile ${shellQuote(detail.profile)} \\`);
  console.log(`  --expected ${shellQuote(detail.expected)} \\`);
  console.log(`  --actual ${shellQuote(detail.actual)} \\`);
  console.log('  --result pending');
  console.log('');
  console.log('Then validate:');
  console.log(`node scripts/validate-family-device-evidence.mjs ${shellQuote(outPacket)}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const planPath = path.resolve(args.plan);
  const evidenceDir = path.resolve(args.evidenceDir);
  const markdown = fs.readFileSync(planPath, 'utf8');
  const rows = extractManualLogRows(markdown);
  const files = listEvidenceFiles(evidenceDir);
  const staticProofs = getStaticProofs(markdown);
  const counts = rows.reduce((acc, row) => {
    acc[row.result] = (acc[row.result] || 0) + 1;
    return acc;
  }, {});
  const byCase = new Map(rows.map((row) => [row.caseId, row]));
  const minimum = MINIMUM_ROWS.map((caseId) => {
    const row = byCase.get(caseId);
    const evidence = row
      ? summarizeEvidence(row, files, evidenceDir)
      : { visuals: [], json: [], jsonPackets: [], validJsonPackets: [], notes: [] };
    return {
      caseId,
      result: row?.result || 'missing-row',
      evidence
    };
  });
  const missingMinimum = minimum
    .map((row) => ({
      ...row,
      missingArtifacts: getMissingArtifacts(row.caseId, row.evidence)
    }))
    .filter((row) => row.result !== 'pass' || row.missingArtifacts.length);
  const missingStaticProofs = staticProofs.filter((proof) => proof.result !== 'pass');

  console.log('Family Devices Phase 11 status');
  console.log(`Plan: ${args.plan}`);
  console.log(`Evidence: ${args.evidenceDir}`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Results: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`);
  console.log('');
  console.log('Minimum release evidence set:');
  minimum.forEach((row) => {
    const visualCount = row.evidence.visuals.length;
    const jsonCount = row.evidence.json.length;
    const validJsonCount = row.evidence.validJsonPackets.length;
    const missingArtifacts = getMissingArtifacts(row.caseId, row.evidence);
    const artifactLabel = missingArtifacts.length ? `; missing ${missingArtifacts.join('+')}` : '';
    const jsonLabel = jsonCount ? `${jsonCount} json, ${validJsonCount} valid pass packet` : '0 json';
    console.log(`- ${row.caseId}: ${row.result} (${visualCount} visual, ${jsonLabel}${artifactLabel})`);
  });
  staticProofs.forEach((proof) => {
    console.log(`- ${proof.id}: ${proof.result} (${proof.label})`);
  });

  if (missingMinimum.length || missingStaticProofs.length) {
    console.log('');
    if (missingMinimum.length) {
      console.log(`Missing minimum pass rows/artifacts: ${missingMinimum.map((row) => {
        const resultLabel = row.result !== 'pass' ? ` row ${row.result}` : '';
        const artifactLabel = row.missingArtifacts.length ? ` missing ${row.missingArtifacts.join('+')}` : '';
        return `${row.caseId}${resultLabel}${artifactLabel}`;
      }).join(', ')}`);
    }
    if (missingStaticProofs.length) {
      console.log(`Missing static minimum proofs: ${missingStaticProofs.map((proof) => proof.id).join(', ')}`);
    }
  } else {
    console.log('');
    console.log('Minimum release evidence rows and static proofs are complete.');
  }

  if (args.next) {
    printNextCaptureCommand(args, rows, minimum, files);
  }

  if (args.requireMinimumPass && (missingMinimum.length || missingStaticProofs.length)) {
    console.log('');
    console.log('Strict release evidence gate failed.');
    console.log('Capture or import the missing installed-extension evidence above, then rerun:');
    console.log('npm run audit:family-devices:phase11:strict');
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(`Family Devices Phase 11 status failed: ${error.message}`);
  process.exit(1);
}
