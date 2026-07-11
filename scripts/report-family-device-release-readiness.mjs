#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const CHECKS = [
  {
    label: 'Phase 11 installed evidence',
    command: [
      'node',
      'scripts/report-family-device-phase11-status.mjs',
      '--require-minimum-pass',
      '--next'
    ],
    failMeaning: 'minimum installed-extension evidence is missing or unreviewed'
  },
  {
    label: 'Phase 12 map and tap-flow checklist',
    command: [
      'node',
      'scripts/report-family-device-phase12-status.mjs',
      '--require-release-complete',
      '--next'
    ],
    failMeaning: 'release-pending map/tap-flow proof is still missing'
  },
  {
    label: 'Configured provider boundary',
    command: [
      'node',
      'scripts/report-family-device-provider-surface.mjs',
      '--strict'
    ],
    failMeaning: 'Home Pickup provider boundary checks failed'
  }
];

function runCheck(check) {
  const [cmd, ...args] = check.command;
  const result = spawnSync(cmd, args, {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  return {
    ...check,
    status: typeof result.status === 'number' ? result.status : 1,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim()
  };
}

function printOutput(result) {
  console.log('');
  console.log(`## ${result.label}`);
  console.log(`Command: ${result.command.join(' ')}`);
  console.log(`Result: ${result.status === 0 ? 'pass' : 'fail'}`);
  if (result.status !== 0) {
    console.log(`Meaning: ${result.failMeaning}`);
  }
  if (result.stdout) {
    console.log('');
    console.log(result.stdout);
  }
  if (result.stderr) {
    console.log('');
    console.log(result.stderr);
  }
}

function main() {
  console.log('Family Devices release-readiness gate');
  console.log('This aggregates the installed evidence gate, Phase 12 checklist, and provider boundary audit.');
  console.log('It does not create evidence or mark checklist rows pass.');

  const results = CHECKS.map(runCheck);
  results.forEach(printOutput);

  const failed = results.filter((result) => result.status !== 0);
  console.log('');
  console.log('Summary');
  console.log(`- Checks: ${results.length}`);
  console.log(`- Passed: ${results.length - failed.length}`);
  console.log(`- Failed: ${failed.length}`);
  if (failed.length) {
    console.log('');
    console.log('Release readiness: not ready');
    failed.forEach((result) => {
      console.log(`- ${result.label}: ${result.failMeaning}`);
    });
    process.exitCode = 1;
    return;
  }
  console.log('');
  console.log('Release readiness: ready for the Family Devices release boundary.');
}

main();
