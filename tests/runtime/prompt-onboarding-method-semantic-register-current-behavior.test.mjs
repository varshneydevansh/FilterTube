import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const promptFiles = [
  'js/content/first_run_prompt.js',
  'js/content/release_notes_prompt.js'
];
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function doc() {
  return read(docPath);
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function source(file) {
  return read(file);
}

function combinedPromptSource() {
  return promptFiles.map(read).join('\n');
}

function methodGroup(name) {
  if (name === 'getPalette') return 'promptThemePalette';
  if (name === 'createPrompt') return 'promptDomAssembly';
  if (['markComplete', 'removePrompt', 'ackAndDismiss'].includes(name)) {
    return 'promptDismissalAndAck';
  }
  if (name === 'init') return 'promptEligibilityRequest';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  for (const file of promptFiles) {
    source(file).split(/\r?\n/).forEach((line, index) => {
      const match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
      if (match) {
        rows.push({
          file,
          line: index + 1,
          kind: match[1] ? 'async function' : 'function',
          name: match[2],
          group: methodGroup(match[2])
        });
      }
    });
  }
  return rows;
}

function lineNumberAt(sourceText, index) {
  return sourceText.slice(0, index).split(/\r?\n/).length;
}

function broadCallableRows(file) {
  const sourceText = source(file);
  const lines = sourceText.split(/\r?\n/);
  const rows = [];
  let match;
  while ((match = broadCallableRe.exec(sourceText))) {
    const firstNonWhitespace = match[0].search(/\S/);
    const start = match.index + firstNonWhitespace;
    const line = lineNumberAt(sourceText, start);
    rows.push({
      file,
      line,
      name: match.slice(1).find(Boolean),
      sourceLine: lines[line - 1].trim()
    });
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function sliceBetween(sourceText, startNeedle, endNeedle) {
  const start = sourceText.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = sourceText.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return sourceText.slice(start, end);
}

function isolatedScripts(manifestFile) {
  const manifest = readJson(manifestFile);
  return manifest.content_scripts.find((entry) =>
    Array.isArray(entry.js) && entry.js.includes('js/content/release_notes_prompt.js')
  )?.js || [];
}

function createFakeNode(tagName) {
  const classes = new Set();
  const node = {
    tagName: tagName.toUpperCase(),
    id: '',
    type: '',
    textContent: '',
    style: {},
    attributes: {},
    children: [],
    parentNode: null,
    removed: false,
    classList: {
      add(...names) {
        names.forEach((name) => classes.add(name));
      },
      contains(name) {
        return classes.has(name);
      }
    },
    appendChild(child) {
      child.parentNode = node;
      node.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      node.attributes[name] = String(value);
      if (name === 'id') node.id = String(value);
    },
    getAttribute(name) {
      return node.attributes[name];
    },
    remove() {
      node.removed = true;
      if (node.parentNode) {
        node.parentNode.children = node.parentNode.children.filter((child) => child !== node);
      }
    }
  };
  return node;
}

function collectNodes(root) {
  const out = [];
  function visit(node) {
    out.push(node);
    for (const child of node.children || []) visit(child);
  }
  visit(root);
  return out;
}

function createFakeDocument(readyState = 'complete') {
  const document = {
    readyState,
    listeners: [],
    head: createFakeNode('head'),
    body: createFakeNode('body'),
    createElement(tagName) {
      return createFakeNode(tagName);
    },
    getElementById(id) {
      return [...collectNodes(document.head), ...collectNodes(document.body)]
        .find((node) => !node.removed && node.id === id) || null;
    },
    addEventListener(type, listener, options) {
      document.listeners.push({ type, listener, options });
    }
  };
  return document;
}

function runPromptScript(file, options = {}) {
  const messages = [];
  const timers = [];
  const opens = [];
  const hrefWrites = [];
  const reloads = [];
  const document = createFakeDocument(options.readyState || 'complete');
  const location = {
    reload() {
      reloads.push('reload');
    }
  };
  Object.defineProperty(location, 'href', {
    get() {
      return hrefWrites.at(-1);
    },
    set(value) {
      hrefWrites.push(value);
    }
  });

  const runtime = {
    lastError: null,
    getURL(pathname) {
      return options.getURL || `chrome-extension://filtertube/${pathname}`;
    },
    sendMessage(message, callback) {
      messages.push(message);
      const action = message?.action;
      runtime.lastError = options.lastErrorByAction?.[action] || null;
      if (callback) callback(options.responses?.[action]);
      runtime.lastError = null;
    }
  };

  const context = {
    browserAPI_BRIDGE: { runtime },
    document,
    location,
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    },
    window: {
      location,
      matchMedia() {
        return { matches: Boolean(options.prefersDark) };
      },
      open(url, target, features) {
        opens.push({ url, target, features });
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(source(file), context, { filename: file });

  return { document, hrefWrites, messages, opens, reloads, timers };
}

function nodesByTag(runtime, tagName) {
  const wanted = tagName.toUpperCase();
  return [...collectNodes(runtime.document.head), ...collectNodes(runtime.document.body)]
    .filter((node) => !node.removed && node.tagName === wanted);
}

function buttonByText(runtime, text) {
  return nodesByTag(runtime, 'button').find((node) => node.textContent === text);
}

test('prompt onboarding method semantic register is audit-only and source scoped', () => {
  const text = doc();
  const firstRun = source('js/content/first_run_prompt.js');
  const release = source('js/content/release_notes_prompt.js');
  const combined = combinedPromptSource();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source files: js\/content\/first_run_prompt\.js, js\/content\/release_notes_prompt\.js/);
  assert.equal(sourceLineCount(firstRun), 190);
  assert.equal(sourceLineCount(release), 250);
  assert.match(text, /first_run_prompt\.js bytes: 7453/);
  assert.match(text, /first_run_prompt\.js sha256: 5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409/);
  assert.equal(readBuffer('js/content/first_run_prompt.js').length, 7453);
  assert.equal(sha256('js/content/first_run_prompt.js'), '5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409');
  assert.match(text, /release_notes_prompt\.js bytes: 9866/);
  assert.match(text, /release_notes_prompt\.js sha256: 30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474/);
  assert.equal(readBuffer('js/content/release_notes_prompt.js').length, 9866);
  assert.equal(sha256('js/content/release_notes_prompt.js'), '30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474');
  assert.match(text, /combined source lines: 440/);
  assert.match(text, /prompt content-script modules: 2/);
  assert.match(text, /repo-wide broad parser lexical callable matches in scope: 19/);
  assert.match(text, /runtime function declarations in scope: 9/);
  assert.match(text, /runtime const arrow callable declarations in scope: 1/);
  assert.match(text, /control-flow lexical artifacts in scope: 9/);
  assert.match(text, /file-local executable behavior rows: 7/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /named function declarations: 9/);
  assert.match(text, /plain function declarations: 9/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /const arrow callback declarations: 1/);
  assert.match(text, /arrow token sites: 14/);
  assert.match(text, /semantic method groups: 4/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for prompt priority/);

  assert.equal(count(combined, /^\s*function\s+[A-Za-z_$][\w$]*\s*\(/gm), 9);
  assert.equal(count(combined, /^\s*async\s+function\s+[A-Za-z_$][\w$]*\s*\(/gm), 0);
  assert.equal(count(combined, /=>/g), 14);
  assert.equal(count(combined, /^\s*const\s+[A-Za-z_$][\w$]*\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/gm), 1);
  assert.equal(broadCallableRows('js/content/first_run_prompt.js').length, 7);
  assert.equal(broadCallableRows('js/content/release_notes_prompt.js').length, 12);
});

test('prompt onboarding register accounts for every current named function row', () => {
  const text = doc();
  const rows = methodRows();
  const firstRunBroadRows = broadCallableRows('js/content/first_run_prompt.js');
  const releaseBroadRows = broadCallableRows('js/content/release_notes_prompt.js');

  assert.equal(rows.length, 9);
  assert.deepEqual(firstRunBroadRows.map((row) => row.name), [
    'getPalette',
    'if',
    'createPrompt',
    'markComplete',
    'init',
    'if',
    'if'
  ]);
  assert.deepEqual(releaseBroadRows.map((row) => row.name), [
    'getPalette',
    'if',
    'removePrompt',
    'if',
    'ackAndDismiss',
    'if',
    'createPrompt',
    'if',
    'if',
    'init',
    'ready',
    'if'
  ]);
  assert.deepEqual(countBy(rows, 'kind'), { function: 9 });
  assert.deepEqual(countBy(rows, 'group'), {
    promptDismissalAndAck: 3,
    promptDomAssembly: 2,
    promptEligibilityRequest: 2,
    promptThemePalette: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.name}:${row.line} should be classified`);
    assert.ok(
      text.includes(`| \`${row.file}\` | ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing prompt method row ${row.file}:${row.name}:${row.line}`
    );
  }

  assert.match(text, /## Lexical Callable Reconciliation/);
  assert.match(text, /the 19 broad-parser matches reconcile to 9 named functions, 1\s+local `ready` callback, and 9 control-flow artifacts/);
  assert.match(text, /\| `js\/content\/first_run_prompt\.js` \| 7 \| 4 named functions \| 3 \|/);
  assert.match(text, /\| `js\/content\/release_notes_prompt\.js` \| 12 \| 5 named functions \+ 1 local const arrow callback \| 6 \|/);
  for (const token of [
    '| `js/content/first_run_prompt.js` | 13 | `if` | no | `if (prefersDark) {`',
    '| `js/content/first_run_prompt.js` | 179 | `if` | no | `if (resp && resp.needed) {`',
    '| `js/content/first_run_prompt.js` | 180 | `if` | no | `if (document.readyState ===',
    '| `js/content/release_notes_prompt.js` | 29 | `if` | no | `if (prefersDark) {`',
    '| `js/content/release_notes_prompt.js` | 60 | `if` | no | `if (existing) {`',
    '| `js/content/release_notes_prompt.js` | 71 | `if` | no | `if (!payloadCache?.version) {`',
    '| `js/content/release_notes_prompt.js` | 149 | `if` | no | `if (targetLink) {`',
    '| `js/content/release_notes_prompt.js` | 166 | `if` | no | `if (api.runtime.lastError) {`',
    '| `js/content/release_notes_prompt.js` | 240 | `ready` | yes | `const ready = () => createPrompt(resp.payload);`',
    '| `js/content/release_notes_prompt.js` | 241 | `if` | no | `if (document.readyState ==='
  ]) {
    assert.ok(text.includes(token), `missing broad callable reconciliation token ${token}`);
  }
  assert.match(text, /it does not promote the global method proof count/);
  assert.match(text, /0 complete\s+per-callable semantic files/);
});

test('prompt onboarding register pins callback inventory and primitive counts', () => {
  const text = doc();
  const combined = combinedPromptSource();
  const expectedLocalRows = [
    ['js/content/first_run_prompt.js', 104, 'refreshBtn.onclick = () =>', 'window.location.reload()'],
    ['js/content/first_run_prompt.js', 119, 'dismissBtn.onclick = () =>', 'schedules DOM removal'],
    ['js/content/first_run_prompt.js', 122, 'setTimeout(() => container.remove(), 180)', 'close transition'],
    ['js/content/first_run_prompt.js', 140, 'closeBtn.onclick = () =>', 'schedules DOM removal'],
    ['js/content/first_run_prompt.js', 143, 'setTimeout(() => container.remove(), 180)', 'close transition'],
    ['js/content/first_run_prompt.js', 178, 'sendMessage(..., (resp) =>', 'first-run eligibility'],
    ['js/content/release_notes_prompt.js', 62, 'setTimeout(() => existing.remove(), 180)', 'close transition'],
    ['js/content/release_notes_prompt.js', 78, 'sendMessage(..., () =>', 'dismissed = true'],
    ['js/content/release_notes_prompt.js', 162, 'learnBtn.onclick = () =>', 'FilterTube_OpenWhatsNew'],
    ['js/content/release_notes_prompt.js', 165, 'sendMessage(..., () =>', 'window.open'],
    ['js/content/release_notes_prompt.js', 190, 'dismissBtn.onclick = () => ackAndDismiss()', 'Acknowledges'],
    ['js/content/release_notes_prompt.js', 205, 'closeBtn.onclick = () => ackAndDismiss()', 'Acknowledges'],
    ['js/content/release_notes_prompt.js', 238, 'sendMessage(..., (resp) =>', 'release-note eligibility'],
    ['js/content/release_notes_prompt.js', 240, 'const ready = () => createPrompt(resp.payload)', 'DOMContentLoaded']
  ];

  for (const [file, line, callback, effectToken] of expectedLocalRows) {
    assert.ok(text.includes(`| \`${file}\` | ${line} | \`${callback}\` |`), `missing callback row ${file}:${line}`);
    assert.ok(text.includes(effectToken), `missing callback effect token ${effectToken}`);
  }

  const countPairs = [
    ['document literal occurrences', count(combined, /\bdocument\b/g)],
    ['window literal occurrences', count(combined, /\bwindow\b/g)],
    ['location literal occurrences', count(combined, /\blocation\b/g)],
    ['browserAPI_BRIDGE references', count(combined, /browserAPI_BRIDGE/g)],
    ['browser references', count(combined, /\bbrowser\b/g)],
    ['chrome references', count(combined, /\bchrome\b/g)],
    ['document.createElement calls', count(combined, /document\.createElement\s*\(/g)],
    ['document.getElementById calls', count(combined, /document\.getElementById\s*\(/g)],
    ['document.head.appendChild calls', count(combined, /document\.head\.appendChild\s*\(/g)],
    ['document.body.appendChild calls', count(combined, /document\.body\.appendChild\s*\(/g)],
    ['appendChild calls', count(combined, /\.appendChild\s*\(/g)],
    ['remove calls', count(combined, /\.remove\s*\(/g)],
    ['setAttribute calls', count(combined, /\.setAttribute\s*\(/g)],
    ['classList.add calls', count(combined, /\.classList\.add\s*\(/g)],
    ['textContent references', count(combined, /\.textContent\b/g)],
    ['onclick assignments', count(combined, /\.onclick\s*=/g)],
    ['addEventListener calls', count(combined, /addEventListener\s*\(/g)],
    ['removeEventListener calls', count(combined, /removeEventListener\s*\(/g)],
    ['MutationObserver references', count(combined, /MutationObserver/g)],
    ['setTimeout calls', count(combined, /setTimeout\s*\(/g)],
    ['setInterval calls', count(combined, /setInterval\s*\(/g)],
    ['clearTimeout calls', count(combined, /clearTimeout\s*\(/g)],
    ['fetch calls', count(combined, /\bfetch\s*\(/g)],
    ['runtime sendMessage calls', count(combined, /sendMessage\s*\(/g)],
    ['runtime getURL calls', count(combined, /runtime\.getURL\s*\(/g)],
    ['runtime lastError references', count(combined, /lastError/g)],
    ['window.open calls', count(combined, /window\.open\s*\(/g)],
    ['location.href writes', count(combined, /location\.href\s*=/g)],
    ['window.location.reload calls', count(combined, /window\.location\.reload\s*\(/g)],
    ['try blocks', count(combined, /\btry\s*\{/g)],
    ['catch blocks', count(combined, /\bcatch\s*\(/g)],
    ['matchMedia calls', count(combined, /matchMedia\s*\(/g)],
    ['DOMContentLoaded tokens', count(combined, /DOMContentLoaded/g)],
    ['PROMPT_ID references', count(combined, /PROMPT_ID/g)],
    ['dismissed references', count(combined, /dismissed/g)],
    ['payloadCache references', count(combined, /payloadCache/g)],
    ['FilterTube action token occurrences', count(combined, /FilterTube_[A-Za-z0-9_]+/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: ${value}`));
  }
});

test('prompt onboarding register preserves manifest and background entrypoint facts', () => {
  const text = doc();
  const background = read('js/background.js');
  const installBlock = sliceBetween(
    background,
    "if (details.reason === 'install') {",
    "} else if (details.reason === 'update') {"
  );
  const updateBlock = sliceBetween(
    background,
    "} else if (details.reason === 'update') {",
    '        // You could handle migration of settings between versions here if needed'
  );

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const scripts = isolatedScripts(manifestFile);
    assert.ok(scripts.includes('js/content/release_notes_prompt.js'), `${manifestFile} missing release prompt`);
    assert.ok(scripts.includes('js/content/first_run_prompt.js'), `${manifestFile} missing first-run prompt`);
    assert.ok(scripts.includes('js/content_bridge.js'), `${manifestFile} missing content bridge`);
    assert.ok(
      scripts.indexOf('js/content/release_notes_prompt.js') < scripts.indexOf('js/content/first_run_prompt.js'),
      `${manifestFile} should load release prompt before first-run prompt`
    );
    assert.ok(
      scripts.indexOf('js/content/first_run_prompt.js') < scripts.indexOf('js/content_bridge.js'),
      `${manifestFile} should load first-run prompt before content bridge`
    );
  }

  assert.match(installBlock, /firstRunRefreshNeeded:\s*true/);
  assert.match(installBlock, /releaseNotesSeenVersion:\s*CURRENT_VERSION/);
  assert.match(installBlock, /releaseNotesPayload:\s*null/);
  assert.match(installBlock, /files:\s*\['js\/content\/first_run_prompt\.js'\]/);
  assert.doesNotMatch(installBlock, /release_notes_prompt\.js/);

  assert.match(updateBlock, /buildReleaseNotesPayload\(CURRENT_VERSION\)/);
  assert.match(updateBlock, /releaseNotesPayload:\s*payload/);
  assert.match(updateBlock, /firstRunRefreshNeeded:\s*true/);
  assert.match(updateBlock, /files:\s*\['js\/content\/first_run_prompt\.js'\]/);
  assert.doesNotMatch(updateBlock, /release_notes_prompt\.js/);

  for (const token of [
    'manifest.json content script order',
    'manifest.firefox.json content script order',
    'install background injection: first_run_prompt.js only',
    'update background injection: first_run_prompt.js only',
    'first-run eligibility action: FilterTube_FirstRunCheck',
    'first-run ack action: FilterTube_FirstRunComplete',
    'release-note eligibility action: FilterTube_ReleaseNotesCheck',
    'release-note ack action: FilterTube_ReleaseNotesAck',
    'release-note tab-open action: FilterTube_OpenWhatsNew'
  ]) {
    assert.ok(text.includes(token), `missing entrypoint token ${token}`);
  }
});

test('prompt onboarding register pins current DOM, ack, reload, and navigation behavior', () => {
  const text = doc();
  const firstRun = source('js/content/first_run_prompt.js');
  const release = source('js/content/release_notes_prompt.js');
  const background = read('js/background.js');
  const releaseAckBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_ReleaseNotesAck') {",
    "} else if (action === 'FilterTube_FirstRunCheck') {"
  );
  const firstRunCompleteBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_FirstRunComplete') {",
    "} else if (action === 'FilterTube_OpenWhatsNew') {"
  );
  const openBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_OpenWhatsNew') {",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress') {"
  );

  assert.match(firstRun, /const PROMPT_ID = 'ft-first-run-refresh-prompt'/);
  assert.match(release, /const PROMPT_ID = 'ft-release-notes-banner'/);
  assert.match(firstRun, /container\.style\.zIndex = '2147483647'/);
  assert.match(release, /container\.style\.zIndex = '2147483646'/);
  assert.match(firstRun, /window\.location\.reload\(\)/);
  assert.match(firstRun, /api\.runtime\.sendMessage\(\{ action: 'FilterTube_FirstRunComplete' \}\)/);
  assert.match(release, /api\.runtime\.getURL\('html\/tab-view\.html\?view=whatsnew'\)/);
  assert.match(release, /const targetLink = WHATS_NEW_URL \|\| payload\.link/);
  assert.match(release, /action: 'FilterTube_OpenWhatsNew', url: targetLink/);
  assert.match(release, /window\.open\(targetLink, '_blank', 'noopener'\)/);
  assert.match(release, /location\.href = targetLink/);
  assert.match(release, /if \(!payloadCache\?\.version\)/);
  assert.match(releaseAckBlock, /releaseNotesSeenVersion:\s*version \|\| CURRENT_VERSION/);
  assert.match(firstRunCompleteBlock, /firstRunRefreshNeeded:\s*false/);
  assert.match(openBlock, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(openBlock, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);

  for (const sourceText of [firstRun, release]) {
    assert.match(sourceText, /document\.getElementById\(PROMPT_ID\)/);
    assert.match(sourceText, /document\.head\.appendChild\(style\)/);
    assert.match(sourceText, /document\.body\.appendChild\(container\)/);
    assert.match(sourceText, /@media \(max-width: 600px\)/);
    assert.match(sourceText, /left: 12px;/);
    assert.match(sourceText, /right: 12px;/);
    assert.doesNotMatch(sourceText, /visualViewport|safe-area-inset|env\(safe-area|viewportFit/);
  }

  for (const token of [
    'first-run refresh click: sends FilterTube_FirstRunComplete, then reloads current page',
    'release-note learn click: sends FilterTube_OpenWhatsNew with targetLink',
    'release-note payload without version: removePrompt() runs without ack storage write',
    'style element lifecycle: each prompt appends an anonymous style element and removes only the prompt container',
    'safe-area/visualViewport authority: absent',
    'network/fetch ownership in prompt scripts: none'
  ]) {
    assert.ok(text.includes(token), `missing behavior boundary token ${token}`);
  }

  const firstRunImmediate = runPromptScript('js/content/first_run_prompt.js', {
    responses: { FilterTube_FirstRunCheck: { needed: true } }
  });
  assert.deepEqual(firstRunImmediate.messages.map((message) => message.action), ['FilterTube_FirstRunCheck']);
  const firstRunPrompt = firstRunImmediate.document.getElementById('ft-first-run-refresh-prompt');
  assert.ok(firstRunPrompt, 'first-run prompt should render when needed and document is ready');
  assert.equal(firstRunPrompt.style.zIndex, '2147483647');
  assert.equal(nodesByTag(firstRunImmediate, 'style').length, 1);
  assert.equal(firstRunImmediate.document.body.children.includes(firstRunPrompt), true);
  buttonByText(firstRunImmediate, 'Refresh now').onclick();
  assert.deepEqual(firstRunImmediate.messages.map((message) => message.action), [
    'FilterTube_FirstRunCheck',
    'FilterTube_FirstRunComplete'
  ]);
  assert.equal(firstRunImmediate.reloads.length, 1);
  assert.equal(firstRunImmediate.timers.length, 0);

  const firstRunDismiss = runPromptScript('js/content/first_run_prompt.js', {
    responses: { FilterTube_FirstRunCheck: { needed: true } }
  });
  const firstRunDismissPrompt = firstRunDismiss.document.getElementById('ft-first-run-refresh-prompt');
  buttonByText(firstRunDismiss, 'Not now').onclick();
  assert.deepEqual(firstRunDismiss.messages.map((message) => message.action), [
    'FilterTube_FirstRunCheck',
    'FilterTube_FirstRunComplete'
  ]);
  assert.equal(firstRunDismissPrompt.classList.contains('ft-first-run-closing'), true);
  assert.equal(firstRunDismiss.timers.length, 1);
  assert.equal(firstRunDismiss.timers[0].delay, 180);
  firstRunDismiss.timers[0].callback();
  assert.equal(firstRunDismissPrompt.removed, true);

  const firstRunDeferred = runPromptScript('js/content/first_run_prompt.js', {
    readyState: 'loading',
    responses: { FilterTube_FirstRunCheck: { needed: true } }
  });
  assert.equal(firstRunDeferred.document.getElementById('ft-first-run-refresh-prompt'), null);
  assert.equal(firstRunDeferred.document.listeners.length, 1);
  assert.equal(firstRunDeferred.document.listeners[0].type, 'DOMContentLoaded');
  assert.equal(firstRunDeferred.document.listeners[0].options.once, true);
  firstRunDeferred.document.listeners[0].listener();
  assert.ok(firstRunDeferred.document.getElementById('ft-first-run-refresh-prompt'));

  const releaseLearn = runPromptScript('js/content/release_notes_prompt.js', {
    responses: {
      FilterTube_ReleaseNotesCheck: {
        needed: true,
        payload: {
          version: '9.9.9',
          headline: 'Release headline',
          body: 'Release body',
          ctaLabel: 'Open changes',
          link: 'https://example.invalid/changes'
        }
      }
    }
  });
  const releasePrompt = releaseLearn.document.getElementById('ft-release-notes-banner');
  assert.ok(releasePrompt, 'release prompt should render when needed and payload exists');
  assert.equal(releasePrompt.style.zIndex, '2147483646');
  assert.equal(releasePrompt.getAttribute('role'), 'status');
  assert.equal(releasePrompt.getAttribute('aria-live'), 'polite');
  buttonByText(releaseLearn, 'Open changes').onclick();
  assert.deepEqual(releaseLearn.messages.map((message) => message.action), [
    'FilterTube_ReleaseNotesCheck',
    'FilterTube_OpenWhatsNew',
    'FilterTube_ReleaseNotesAck'
  ]);
  assert.equal(
    releaseLearn.messages.find((message) => message.action === 'FilterTube_OpenWhatsNew').url,
    'chrome-extension://filtertube/html/tab-view.html?view=whatsnew'
  );
  assert.equal(releaseLearn.messages.find((message) => message.action === 'FilterTube_ReleaseNotesAck').version, '9.9.9');
  assert.equal(releaseLearn.opens.length, 0);
  assert.equal(releaseLearn.hrefWrites.length, 0);
  assert.equal(releasePrompt.classList.contains('ft-release-notes-closing'), true);
  assert.equal(releaseLearn.timers.length, 1);
  assert.equal(releaseLearn.timers[0].delay, 180);

  const releaseNoVersion = runPromptScript('js/content/release_notes_prompt.js', {
    responses: {
      FilterTube_ReleaseNotesCheck: {
        needed: true,
        payload: { headline: 'No version payload', body: 'No version body' }
      }
    }
  });
  const noVersionPrompt = releaseNoVersion.document.getElementById('ft-release-notes-banner');
  buttonByText(releaseNoVersion, 'Got it').onclick();
  assert.deepEqual(releaseNoVersion.messages.map((message) => message.action), [
    'FilterTube_ReleaseNotesCheck'
  ]);
  assert.equal(noVersionPrompt.classList.contains('ft-release-notes-closing'), true);
  assert.equal(releaseNoVersion.timers[0].delay, 180);

  const releaseDeferred = runPromptScript('js/content/release_notes_prompt.js', {
    readyState: 'loading',
    responses: {
      FilterTube_ReleaseNotesCheck: {
        needed: true,
        payload: { version: '1.0.0', headline: 'Deferred', body: 'Deferred body' }
      }
    }
  });
  assert.equal(releaseDeferred.document.getElementById('ft-release-notes-banner'), null);
  assert.equal(releaseDeferred.document.listeners.length, 1);
  assert.equal(releaseDeferred.document.listeners[0].type, 'DOMContentLoaded');
  assert.equal(releaseDeferred.document.listeners[0].options.once, true);
  releaseDeferred.document.listeners[0].listener();
  assert.ok(releaseDeferred.document.getElementById('ft-release-notes-banner'));

  for (const token of [
    'first-run executable proof: ready document plus needed response creates ft-first-run-refresh-prompt',
    'first-run executable proof: Refresh now sends FilterTube_FirstRunComplete and increments reload count without scheduling a timer',
    'first-run executable proof: Not now adds ft-first-run-closing and schedules one 180ms removal timer',
    'first-run executable proof: loading document registers one one-shot DOMContentLoaded listener before rendering',
    'release-note executable proof: Learn click sends FilterTube_OpenWhatsNew to the in-extension What New URL and then FilterTube_ReleaseNotesAck with payload version',
    'release-note executable proof: payload without version removes the prompt without sending FilterTube_ReleaseNotesAck',
    'release-note executable proof: loading document registers one one-shot DOMContentLoaded listener before rendering'
  ]) {
    assert.ok(text.includes(token), `missing executable proof token ${token}`);
  }
});

test('prompt onboarding register records missing coordinator, trust, and authority symbols', () => {
  const text = doc();
  const runtime = [
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js',
    'js/background.js',
    'js/tab-view.js',
    'js/ui_components.js',
    'js/popup.js'
  ].map(read).join('\n');

  for (const absent of [
    'PromptCoordinator',
    'promptQueue',
    'activePromptOwner',
    'promptOnboardingMethodAuthority',
    'promptOnboardingQueueContract',
    'promptOnboardingSenderClassContract',
    'promptOnboardingStorageAckReport',
    'promptOnboardingUrlNavigationPolicy',
    'promptOnboardingDomLifecycleContract',
    'promptOnboardingViewportFitProof',
    'promptOnboardingDuplicateOverlayRegistry',
    'promptOnboardingStyleTeardownRegistry',
    'promptOnboardingFixtureProvenance'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(absent), `runtime should not contain ${absent}`);
    assert.ok(text.includes(absent), `doc should record missing token ${absent}`);
  }
});

test('prompt onboarding register defines future proof fields and risk boundaries', () => {
  const text = doc();

  for (const token of [
    'promptMethodReference',
    'promptOwnerId',
    'promptInstanceId',
    'senderClass',
    'ackAllowed',
    'visibleOwner',
    'blockedByOwner',
    'priority',
    'styleOwner',
    'viewportFit',
    'urlAllowed',
    'fallbackNavigation',
    'storageKeysWritten',
    'timerBudget',
    'listenerBudget',
    'teardownPolicy',
    'Reliability risk remains concentrated in independent prompt owners',
    'False-hide/leak risk is indirect but still relevant'
  ]) {
    assert.ok(text.includes(token), `missing future proof or risk token ${token}`);
  }
  assert.match(text, /Performance\/code-burden risk is small per prompt but split across two nearly\s+parallel DOM builders/);
});
