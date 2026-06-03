import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const registerPath = 'docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md';

const LIFECYCLE_PATTERNS = {
  addEventListener: /\.addEventListener\s*\(/g,
  removeEventListener: /\.removeEventListener\s*\(/g,
  mutationObserver: /new\s+MutationObserver\s*\(/g,
  intersectionObserver: /new\s+IntersectionObserver\s*\(/g,
  setInterval: /\bsetInterval\s*\(/g,
  clearInterval: /\bclearInterval\s*\(/g,
  setTimeout: /\bsetTimeout\s*\(/g,
  clearTimeout: /\bclearTimeout\s*\(/g,
  requestAnimationFrame: /\brequestAnimationFrame\s*\(/g,
  cancelAnimationFrame: /\bcancelAnimationFrame\s*\(/g
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function classifySourceFamily(file) {
  if (file === 'build.js' || file.startsWith('scripts/')) return 'build-release-sync-scripts';
  if (file.startsWith('src/')) return 'generated-ui-source';
  if (file.startsWith('js/vendor/')) return 'vendor-bundles';
  if (file.startsWith('js/ui-shell/')) return 'generated-ui-output';
  if (file === 'js/layout.js') return 'quarantined-legacy-js';
  if (
    /^js\/content\//.test(file) ||
    [
      'js/content_bridge.js',
      'js/injector.js',
      'js/seed.js',
      'js/filter_logic.js',
      'js/shared/identity.js'
    ].includes(file)
  ) return 'content-runtime-js';
  if (file.startsWith('js/')) return 'extension-ui-background-js';
  if (file.startsWith('website/app/')) return 'website-app-routes';
  if (file.startsWith('website/components/')) return 'website-components';
  if (file.startsWith('website/')) return 'website-config';
  return 'UNCLASSIFIED';
}

function classifyOwner(file) {
  if (file === 'build.js' || file.startsWith('scripts/')) return 'build-release-sync-owner';
  if (file === 'js/seed.js') return 'seed-network-owner';
  if (file === 'js/content_bridge.js') return 'content-bridge-owner';
  if (file === 'js/content/block_channel.js') return 'quick-and-menu-owner';
  if (file === 'js/content/dom_fallback.js') return 'dom-fallback-owner';
  if (file === 'js/content/collab_dialog.js') return 'collaborator-dialog-owner';
  if (file === 'js/injector.js') return 'injector-page-world-owner';
  if (file === 'js/background.js') return 'background-authority-owner';
  if (file === 'js/tab-view.js') return 'dashboard-ui-owner';
  if (file === 'js/popup.js') return 'popup-ui-owner';
  if (['js/state_manager.js', 'js/io_manager.js', 'js/nanah_sync_adapter.js'].includes(file)) return 'state-import-owner';
  if (file === 'js/layout.js') return 'quarantined-legacy-owner';
  if (file.startsWith('js/vendor/')) return 'vendor-transport-owner';
  if (file.startsWith('js/ui-shell/') || file.startsWith('src/extension-shell/')) return 'generated-shell-owner';
  if (file.startsWith('website/')) return 'website-client-owner';
  if (file.startsWith('src/')) return 'generated-shell-source-owner';
  if (file.startsWith('js/content/')) return 'content-helper-owner';
  if (file.startsWith('js/')) return 'extension-ui-background-owner';
  return 'other-owner';
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineForIndex(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return high + 1;
}

function isRegexLiteralStart(previousSignificant) {
  return previousSignificant == null || '({[=,:;!&|?+-*~^<>'.includes(previousSignificant);
}

function lineOf(file, needle) {
  const lines = read(file).split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle}`);
  return index + 1;
}

function lineOfAfter(file, afterNeedle, needle) {
  const lines = read(file).split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes(afterNeedle));
  assert.ok(start >= 0, `${file} missing anchor ${afterNeedle}`);
  const index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle} after ${afterNeedle}`);
  return index + 1;
}

function enumerateLifecycleInstances() {
  const files = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('docs/audit/') && !file.startsWith('tests/'));
  const rows = [];

  for (const file of files) {
    const text = read(file);
    const starts = lineStarts(text);
    const lines = text.split('\n');
    const sourceFamily = classifySourceFamily(file);
    const owner = classifyOwner(file);
    assert.notEqual(sourceFamily, 'UNCLASSIFIED', `${file} must be source-family classified`);
    assert.notEqual(owner, 'other-owner', `${file} must be owner classified`);

    for (const [family, pattern] of Object.entries(LIFECYCLE_PATTERNS)) {
      for (const match of text.matchAll(pattern)) {
        const line = lineForIndex(starts, match.index);
        rows.push({
          id: `${file}:${line}:${family}`,
          file,
          line,
          sourceIndex: match.index,
          family,
          sourceFamily,
          owner,
          snippet: (lines[line - 1] || '').trim()
        });
      }
    }
  }

  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function lifecycleRole(family) {
  if (['removeEventListener', 'clearInterval', 'clearTimeout', 'cancelAnimationFrame'].includes(family)) {
    return 'explicit-teardown';
  }
  if ([
    'addEventListener',
    'mutationObserver',
    'intersectionObserver',
    'setInterval',
    'setTimeout',
    'requestAnimationFrame'
  ].includes(family)) {
    return 'install-or-schedule';
  }
  return 'other';
}

function countInstallTeardownBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { install: 0, teardown: 0, total: 0 };
    out[row.sourceFamily].total += 1;
    if (lifecycleRole(row.family) === 'install-or-schedule') {
      out[row.sourceFamily].install += 1;
    } else if (lifecycleRole(row.family) === 'explicit-teardown') {
      out[row.sourceFamily].teardown += 1;
    }
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function extractCallArgs(text, openParenIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let regexLiteral = false;
  let regexClass = false;
  let previousSignificant = null;
  for (let index = openParenIndex; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (regexLiteral) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '[') {
        regexClass = true;
        continue;
      }
      if (char === ']') {
        regexClass = false;
        continue;
      }
      if (char === '/' && !regexClass) {
        regexLiteral = false;
        previousSignificant = '/';
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && isRegexLiteralStart(previousSignificant)) {
      regexLiteral = true;
      regexClass = false;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(openParenIndex + 1, index);
    }
    if (!/\s/.test(char)) previousSignificant = char;
  }
  return '';
}

function splitTopLevelArgs(argsSource) {
  const args = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let regexLiteral = false;
  let regexClass = false;
  let previousSignificant = null;
  for (let index = 0; index < argsSource.length; index += 1) {
    const char = argsSource[index];
    const next = argsSource[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (regexLiteral) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '[') {
        regexClass = true;
        continue;
      }
      if (char === ']') {
        regexClass = false;
        continue;
      }
      if (char === '/' && !regexClass) {
        regexLiteral = false;
        previousSignificant = '/';
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && isRegexLiteralStart(previousSignificant)) {
      regexLiteral = true;
      regexClass = false;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === ',' && depth === 0) {
      args.push(argsSource.slice(start, index).trim());
      start = index + 1;
    }
    if (!/\s/.test(char)) previousSignificant = char;
  }
  args.push(argsSource.slice(start).trim());
  return args;
}

function classifyAddEventListenerEvent(eventSource) {
  if (eventSource == null) return 'missing-event-argument';
  const event = eventSource.trim();
  if (!event) return 'missing-event-argument';
  const quote = event[0];
  if ((quote === '"' || quote === "'" || quote === '`') && event[event.length - 1] === quote) {
    return event.slice(1, -1);
  }
  return 'nonliteral-event';
}

function extractAddEventListenerTarget(text, callIndex) {
  let optionalChain = false;
  let index = callIndex - 1;
  if (text[index] === '?') {
    optionalChain = true;
    index -= 1;
  }
  while (index >= 0 && /\s/.test(text[index])) index -= 1;
  const end = index + 1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (; index >= 0; index -= 1) {
    const char = text[index];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === ')' || char === ']' || char === '}') {
      depth += 1;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') {
      if (depth > 0) {
        depth -= 1;
        continue;
      }
      break;
    }
    if (depth === 0 && (char === ';' || char === '=' || char === ',' || char === '{' || char === '?' || char === ':' || char === '\n')) {
      break;
    }
  }
  const targetSource = text.slice(index + 1, end).trim().replace(/\s+/g, ' ');
  return { optionalChain, targetSource };
}

function classifyAddEventListenerTarget(targetSource, optionalChain = false) {
  if (targetSource === 'document') return 'document';
  if (targetSource === 'window') return 'window';
  if (targetSource === 'n2') return 'generated-shell-node';
  if (/\b(?:socket|peerConnection|dataChannel|channel)\b/i.test(targetSource)) {
    return 'vendor-transport-reference';
  }
  return optionalChain ? 'optional-local-element-reference' : 'local-element-reference';
}

function classifyAddEventListenerOption(optionSource) {
  if (optionSource == null) return 'no-third-argument';
  const option = optionSource.replace(/\s+/g, ' ').trim();
  if (!option) return 'no-third-argument';
  if (option === 'true') return 'boolean-true-capture';
  if (option === 'false') return 'boolean-false-bubble';
  if (/^\{/.test(option)) {
    const flags = [];
    if (/passive\s*:\s*true/.test(option)) flags.push('passive-true');
    if (/passive\s*:\s*false/.test(option)) flags.push('passive-false');
    if (/capture\s*:\s*true/.test(option)) flags.push('capture-true');
    if (/capture\s*:\s*false/.test(option)) flags.push('capture-false');
    if (/once\s*:\s*true/.test(option)) flags.push('once-true');
    if (/once\s*:\s*false/.test(option)) flags.push('once-false');
    return `object-${flags.length ? flags.join('+') : 'other'}`;
  }
  return 'expression-or-identifier';
}

function enumerateAddEventListenerOptionRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'addEventListener')
    .map((row) => {
      const text = read(row.file);
      const callIndex = row.sourceIndex;
      const openParenIndex = text.indexOf('(', callIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const optionKind = classifyAddEventListenerOption(args[2]);
      return { ...row, optionKind, optionSource: args[2] || '' };
    });
}

function enumerateAddEventListenerEventRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'addEventListener')
    .map((row) => {
      const text = read(row.file);
      const callIndex = row.sourceIndex;
      const openParenIndex = text.indexOf('(', callIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const eventKind = classifyAddEventListenerEvent(args[0]);
      return { ...row, eventKind, eventSource: args[0] || '' };
    });
}

function enumerateAddEventListenerTargetRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'addEventListener')
    .map((row) => {
      const text = read(row.file);
      const callIndex = row.sourceIndex;
      const { optionalChain, targetSource } = extractAddEventListenerTarget(text, callIndex);
      assert.ok(targetSource, `${row.id} missing addEventListener target source`);
      const targetKind = classifyAddEventListenerTarget(targetSource, optionalChain);
      return { ...row, targetKind, targetSource, optionalChain };
    });
}

function enumerateAddEventListenerEventTargetRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'addEventListener')
    .map((row) => {
      const text = read(row.file);
      const callIndex = row.sourceIndex;
      const openParenIndex = text.indexOf('(', callIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const eventKind = classifyAddEventListenerEvent(args[0]);
      const { optionalChain, targetSource } = extractAddEventListenerTarget(text, callIndex);
      assert.ok(targetSource, `${row.id} missing addEventListener target source`);
      const targetKind = classifyAddEventListenerTarget(targetSource, optionalChain);
      return { ...row, eventKind, eventSource: args[0] || '', targetKind, targetSource, optionalChain };
    });
}

function classifyAddEventListenerCallback(callbackSource) {
  if (callbackSource == null) return 'missing-callback-argument';
  const callback = callbackSource.replace(/\s+/g, ' ').trim();
  if (!callback) return 'missing-callback-argument';
  if (/^function\b/.test(callback)) return 'inline-function-callback';
  if (/=>/.test(callback)) return 'inline-arrow-callback';
  if (/\.bind\s*\(/.test(callback)) return 'bound-callback-expression';
  if (/^this\.[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(callback)) {
    return 'this-member-callback-reference';
  }
  if (/^[A-Za-z_$][\w$]*$/.test(callback)) return 'identifier-callback-reference';
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/.test(callback)) {
    return 'member-callback-reference';
  }
  return 'other-callback-expression';
}

function enumerateAddEventListenerCallbackRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'addEventListener')
    .map((row) => {
      const text = read(row.file);
      const callIndex = row.sourceIndex;
      const openParenIndex = text.indexOf('(', callIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const callbackSource = (args[1] || '').replace(/\s+/g, ' ').trim();
      const callbackKind = classifyAddEventListenerCallback(callbackSource);
      return { ...row, callbackKind, callbackSource };
    });
}

function eventListenerCaptureKey(optionKind) {
  if (optionKind === 'expression-or-identifier') return 'capture-expression-or-identifier';
  return optionKind === 'boolean-true-capture' || optionKind.includes('capture-true')
    ? 'capture-true'
    : 'capture-false';
}

function enumerateEventListenerRows(family) {
  return enumerateLifecycleInstances()
    .filter(row => row.family === family)
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const { optionalChain, targetSource } = extractAddEventListenerTarget(text, row.sourceIndex);
      assert.ok(targetSource, `${row.id} missing ${family} target source`);
      const targetKind = classifyAddEventListenerTarget(targetSource, optionalChain);
      const eventSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      const eventKind = classifyAddEventListenerEvent(args[0]);
      const callbackSource = (args[1] || '').replace(/\s+/g, ' ').trim();
      const callbackKind = classifyAddEventListenerCallback(callbackSource);
      const optionKind = classifyAddEventListenerOption(args[2]);
      const captureKey = eventListenerCaptureKey(optionKind);
      return {
        ...row,
        targetKind,
        targetSource,
        optionalChain,
        eventKind,
        eventSource,
        callbackKind,
        callbackSource,
        optionKind,
        captureKey
      };
    });
}

function listenerOptionShapeSignature(row) {
  return [row.targetSource, row.eventSource, row.callbackSource, row.optionKind].join(' | ');
}

function listenerCaptureSignature(row) {
  return [row.targetSource, row.eventSource, row.callbackSource, row.captureKey].join(' | ');
}

function countListenerAddRemoveBySourceFamily(addRows, removeRows) {
  const addByFamily = countBy(addRows, 'sourceFamily');
  const removeByFamily = countBy(removeRows, 'sourceFamily');
  const out = {};
  for (const sourceFamily of Object.keys({ ...addByFamily, ...removeByFamily }).sort()) {
    out[sourceFamily] = {
      add: addByFamily[sourceFamily] || 0,
      remove: removeByFamily[sourceFamily] || 0,
      delta: (addByFamily[sourceFamily] || 0) - (removeByFamily[sourceFamily] || 0)
    };
  }
  return out;
}

function countListenerAddRemoveRiskGaps(addRows, removeRows) {
  const addShapeSignatures = new Set(addRows.map(listenerOptionShapeSignature));
  const addCaptureSignatures = new Set(addRows.map(listenerCaptureSignature));
  const captureMatchedRemoves = removeRows.filter(row => addCaptureSignatures.has(listenerCaptureSignature(row)));
  const shapeMatchedRemoves = removeRows.filter(row => addShapeSignatures.has(listenerOptionShapeSignature(row)));
  const pageGlobalAdds = addRows.filter(row => row.targetKind === 'document' || row.targetKind === 'window').length;
  const pageGlobalRemoves = removeRows.filter(row => row.targetKind === 'document' || row.targetKind === 'window').length;
  return {
    installMinusRemove: addRows.length - removeRows.length,
    captureEquivalentRemovePairs: captureMatchedRemoves.length,
    exactOptionShapeRemovePairs: shapeMatchedRemoves.length,
    captureEquivalentOptionShapeMismatchPairs: captureMatchedRemoves.length - shapeMatchedRemoves.length,
    unmatchedRemoveRows: removeRows.length - captureMatchedRemoves.length,
    pageGlobalListenerInstallsWithoutExplicitRemove: pageGlobalAdds - pageGlobalRemoves,
    inlineListenerInstallsWithoutRemoveHandle: addRows.filter(row => (
      row.callbackKind === 'inline-arrow-callback' || row.callbackKind === 'inline-function-callback'
    )).length
  };
}

function countAddEventOptionsBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.optionKind] = (out[row.sourceFamily][row.optionKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countAddEventEventsBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.eventKind] = (out[row.sourceFamily][row.eventKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countAddEventTargetsBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.targetKind] = (out[row.sourceFamily][row.targetKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countAddEventTargetEvents(rows) {
  const out = {};
  for (const row of rows) {
    out[row.targetKind] ||= { total: 0 };
    out[row.targetKind].total += 1;
    out[row.targetKind][row.eventKind] = (out[row.targetKind][row.eventKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countAddEventGlobalPairsBySourceFamily(rows) {
  const out = {};
  for (const row of rows.filter(entry => entry.targetKind === 'document' || entry.targetKind === 'window')) {
    const key = `${row.sourceFamily}:${row.targetKind}`;
    out[key] ||= { total: 0 };
    out[key].total += 1;
    out[key][row.eventKind] = (out[key][row.eventKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countHighRiskListenerEventTargetPairs(rows) {
  return {
    documentClick: rows.filter(row => row.targetKind === 'document' && row.eventKind === 'click').length,
    documentDOMContentLoaded: rows.filter(row => row.targetKind === 'document' && row.eventKind === 'DOMContentLoaded').length,
    documentKeydown: rows.filter(row => row.targetKind === 'document' && row.eventKind === 'keydown').length,
    documentPointerOrMouse: rows.filter(row => (
      row.targetKind === 'document' &&
      [
        'pointerdown',
        'mousedown',
        'pointermove',
        'pointerover',
        'mouseover',
        'mouseleave',
        'mouseenter',
        'mouseout',
        'mousemove',
        'nonliteral-event'
      ].includes(row.eventKind)
    )).length,
    windowMessage: rows.filter(row => row.targetKind === 'window' && row.eventKind === 'message').length,
    windowRoute: rows.filter(row => (
      row.targetKind === 'window' &&
      ['yt-navigate-finish', 'popstate', 'hashchange'].includes(row.eventKind)
    )).length,
    windowScrollResizeOrientation: rows.filter(row => (
      row.targetKind === 'window' &&
      ['scroll', 'resize', 'orientationchange'].includes(row.eventKind)
    )).length,
    windowStorageVisibility: rows.filter(row => (
      row.targetKind === 'window' &&
      ['storage', 'visibilitychange'].includes(row.eventKind)
    )).length,
    localClick: rows.filter(row => row.targetKind === 'local-element-reference' && row.eventKind === 'click').length,
    localChangeInputKeydown: rows.filter(row => (
      row.targetKind === 'local-element-reference' &&
      ['change', 'input', 'keydown'].includes(row.eventKind)
    )).length,
    optionalLocalClick: rows.filter(row => (
      row.targetKind === 'optional-local-element-reference' &&
      row.eventKind === 'click'
    )).length,
    vendorTransportLifecycle: rows.filter(row => row.targetKind === 'vendor-transport-reference').length,
    generatedShellNonliteral: rows.filter(row => (
      row.targetKind === 'generated-shell-node' &&
      row.eventKind === 'nonliteral-event'
    )).length
  };
}

function countAddEventCallbacksBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.callbackKind] = (out[row.sourceFamily][row.callbackKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyObserverObserveTarget(targetSource) {
  const target = targetSource.replace(/\s+/g, ' ').trim();
  if (target === 'document.body') return 'document-body';
  if (target === 'dropdown') return 'dropdown-element';
  if (target === 'target') return 'generic-target-element';
  if (['hostCard', 'videoCard.parentElement', 'card', 'row'].includes(target)) return 'card-or-row-element';
  if (target === 'panel' || target === 'rail') return 'panel-or-rail-element';
  if (target === 'select') return 'select-element';
  return 'other-observe-target';
}

function classifyObserverObserveReceiver(receiverSource) {
  if (receiverSource === 'observer') return 'local-observer-variable';
  if (receiverSource === 'obs') return 'local-obs-variable';
  if (receiverSource === 'prefetchObserver') return 'prefetch-observer';
  if (receiverSource === 'dropdownDiscoveryObserver') return 'dropdown-discovery-observer';
  if (receiverSource === 'dropdownObserver' || receiverSource === 'closeObserver') return 'dropdown-close-observer';
  if (receiverSource === 'collabDialogObserver') return 'collab-dialog-observer';
  return 'other-observer-observe-receiver';
}

function classifyObserverObserveOption(optionSource) {
  const option = (optionSource || '').replace(/\s+/g, ' ').trim();
  if (!option) return 'no-options';
  if (/attributes\s*:\s*true/.test(option)) {
    if (/data-filtertube-collaborators/.test(option)) return 'attributes-filter-collaborator-identity';
    if (/disabled/.test(option)) return 'attributes-filter-disabled';
    if (/style/.test(option) && /hidden/.test(option)) return 'attributes-filter-style-hidden';
    if (/aria-hidden/.test(option)) return 'attributes-filter-aria-hidden';
    return 'attributes-other';
  }
  if (/childList\s*:\s*true/.test(option) && /subtree\s*:\s*true/.test(option)) {
    return 'child-list-subtree';
  }
  if (/childList\s*:\s*true/.test(option)) return 'child-list-only';
  return 'other-observe-options';
}

function enumerateObserverObserveRows() {
  const files = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('docs/audit/') && !file.startsWith('tests/'));
  const observeRows = [];

  for (const file of files) {
    const text = read(file);
    const starts = lineStarts(text);
    const lines = text.split('\n');
    const sourceFamily = classifySourceFamily(file);
    const owner = classifyOwner(file);
    const localPattern = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\.observe\s*\(/g;
    for (const match of text.matchAll(localPattern)) {
      const openParenIndex = text.indexOf('(', match.index);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const line = lineForIndex(starts, match.index);
      const receiverSource = match[1];
      const targetSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      const optionSource = (args[1] || '').replace(/\s+/g, ' ').trim();
      observeRows.push({
        id: `${file}:${line}:observe`,
        file,
        line,
        sourceIndex: match.index,
        sourceFamily,
        owner,
        receiverSource,
        receiverKind: classifyObserverObserveReceiver(receiverSource),
        targetSource,
        targetKind: classifyObserverObserveTarget(targetSource),
        optionSource,
        optionKind: classifyObserverObserveOption(optionSource),
        snippet: (lines[line - 1] || '').trim()
      });
    }
  }

  return observeRows.sort((a, b) => a.id.localeCompare(b.id));
}

function countObserverObserveTargetsBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.targetKind] = (out[row.sourceFamily][row.targetKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countObserverObserveOptionsBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.optionKind] = (out[row.sourceFamily][row.optionKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countObserverObserveReceiversBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.receiverKind] = (out[row.sourceFamily][row.receiverKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyObserverObserveFamily(row) {
  if (row.receiverSource === 'prefetchObserver') return 'intersectionObserver';
  if (row.file === 'js/content/block_channel.js' && row.targetSource === 'hostCard') return 'intersectionObserver';
  return 'mutationObserver';
}

function countObserverConstructorsBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.family] = (out[row.sourceFamily][row.family] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countObserverObserveFamiliesBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    const observeFamily = classifyObserverObserveFamily(row);
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][observeFamily] = (out[row.sourceFamily][observeFamily] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyObserverCallbackParameter(callbackSource) {
  const callback = callbackSource.replace(/\s+/g, ' ').trim();
  if (/^\(\s*\)\s*=>/.test(callback)) return 'no-parameter-arrow';
  if (/^\(?\s*mutations\s*\)?\s*=>/.test(callback)) return 'mutations-parameter-arrow';
  if (/^\(?\s*entries\s*\)?\s*=>/.test(callback)) return 'entries-parameter-arrow';
  return 'other-callback-parameter-shape';
}

function enumerateObserverConstructorCallbackRows(observerConstructorRows) {
  return observerConstructorRows.map((row) => {
    const text = read(row.file);
    const openParenIndex = text.indexOf('(', row.sourceIndex);
    const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
    const callbackSource = (args[0] || '').replace(/\s+/g, ' ').trim();
    const callbackKind = classifyAddEventListenerCallback(callbackSource);
    const callbackParameterKind = classifyObserverCallbackParameter(callbackSource);
    return { ...row, callbackSource, callbackKind, callbackParameterKind };
  });
}

function countObserverConstructorCallbacksBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.callbackKind] = (out[row.sourceFamily][row.callbackKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyObserverDisconnectReceiver(receiverSource) {
  if (receiverSource === 'observer') return 'local-observer-variable';
  if (receiverSource === 'dropdownDiscoveryObserver') return 'dropdown-discovery-observer';
  if (receiverSource === 'dropdownObserver' || receiverSource === 'closeObserver') return 'dropdown-close-observer';
  if (receiverSource === 'collabDialogObserver') return 'collab-dialog-observer';
  if (receiverSource === 'playlistFallbackPopoverState.rowObserver') return 'popover-row-observer-state';
  return 'other-observer-disconnect-receiver';
}

function enumerateObserverDisconnectRows() {
  const files = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('docs/audit/') && !file.startsWith('tests/'));
  const disconnectRows = [];

  for (const file of files) {
    const text = read(file);
    const starts = lineStarts(text);
    const lines = text.split('\n');
    const sourceFamily = classifySourceFamily(file);
    const owner = classifyOwner(file);
    const localPattern = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\?*\.disconnect(?:\?\.)?\s*\(/g;
    for (const match of text.matchAll(localPattern)) {
      const line = lineForIndex(starts, match.index);
      const receiverSource = match[1];
      disconnectRows.push({
        id: `${file}:${line}:disconnect`,
        file,
        line,
        sourceIndex: match.index,
        sourceFamily,
        owner,
        receiverSource,
        receiverKind: classifyObserverDisconnectReceiver(receiverSource),
        snippet: (lines[line - 1] || '').trim()
      });
    }
  }

  return disconnectRows.sort((a, b) => a.id.localeCompare(b.id));
}

function countObserverDisconnectReceiversBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.receiverKind] = (out[row.sourceFamily][row.receiverKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyObserverUnobserveReceiver(receiverSource) {
  if (receiverSource === 'quickBlockHostVisibilityObserver') return 'quick-block-viewport-observer';
  return 'other-observer-unobserve-receiver';
}

function enumerateObserverUnobserveRows() {
  const files = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('docs/audit/') && !file.startsWith('tests/'));
  const unobserveRows = [];

  for (const file of files) {
    const text = read(file);
    const starts = lineStarts(text);
    const lines = text.split('\n');
    const sourceFamily = classifySourceFamily(file);
    const owner = classifyOwner(file);
    const localPattern = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\.unobserve\s*\(/g;
    for (const match of text.matchAll(localPattern)) {
      const openParenIndex = text.indexOf('(', match.index);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const line = lineForIndex(starts, match.index);
      const receiverSource = match[1];
      unobserveRows.push({
        id: `${file}:${line}:unobserve`,
        file,
        line,
        sourceIndex: match.index,
        sourceFamily,
        owner,
        receiverSource,
        receiverKind: classifyObserverUnobserveReceiver(receiverSource),
        targetSource: (args[0] || '').replace(/\s+/g, ' ').trim(),
        snippet: (lines[line - 1] || '').trim()
      });
    }
  }

  return unobserveRows.sort((a, b) => a.id.localeCompare(b.id));
}

function countObserverObserveReleaseRiskGaps(observeRows, disconnectRows, unobserveRows) {
  const releaseRows = [...disconnectRows, ...unobserveRows];
  const releaseReceiverSources = new Set(releaseRows.map(row => row.receiverSource));
  const localObserveRows = observeRows.filter(row => row.receiverSource === 'observer');
  const exactNamedObserveRows = observeRows.filter(row => (
    row.receiverSource !== 'observer' &&
    row.receiverSource !== 'obs'
  ));
  const localObsObserveRows = observeRows.filter(row => row.receiverSource === 'obs');
  const exactNamedObserveRowsWithRelease = exactNamedObserveRows.filter(row => releaseReceiverSources.has(row.receiverSource));
  const exactNamedObserveRowsWithoutRelease = exactNamedObserveRows.filter(row => !releaseReceiverSources.has(row.receiverSource));

  return {
    observeMinusRelease: observeRows.length - releaseRows.length,
    releaseRows: releaseRows.length,
    disconnectReleaseRows: disconnectRows.length,
    unobserveReleaseRows: unobserveRows.length,
    localObserverObserveRows: localObserveRows.length,
    localObsObserveRows: localObsObserveRows.length,
    exactNamedObserveRows: exactNamedObserveRows.length,
    exactNamedObserveRowsWithRelease: exactNamedObserveRowsWithRelease.length,
    exactNamedObserveRowsWithoutRelease: exactNamedObserveRowsWithoutRelease.length,
    prefetchObserveRowsWithoutRelease: exactNamedObserveRowsWithoutRelease.filter(row => row.receiverSource === 'prefetchObserver').length,
    contentRuntimeObserveReleaseDelta:
      observeRows.filter(row => row.sourceFamily === 'content-runtime-js').length -
      releaseRows.filter(row => row.sourceFamily === 'content-runtime-js').length,
    extensionUiObserveReleaseDelta:
      observeRows.filter(row => row.sourceFamily === 'extension-ui-background-js').length -
      releaseRows.filter(row => row.sourceFamily === 'extension-ui-background-js').length
  };
}

function classifyTimerDelay(delaySource) {
  if (delaySource == null) return 'missing-delay-argument';
  const delay = delaySource.replace(/\s+/g, ' ').trim();
  if (!delay) return 'missing-delay-argument';
  if (/^[-+]?\d+(?:\.\d+)?$/.test(delay)) {
    const value = Number(delay);
    if (value === 0) return 'numeric-zero';
    if (value < 100) return 'numeric-1-99-ms';
    if (value < 200) return 'numeric-100-199-ms';
    if (value < 1000) return 'numeric-200-999-ms';
    if (value < 5000) return 'numeric-1000-4999-ms';
    return 'numeric-5000-plus-ms';
  }
  if (/^Math\.max\(/.test(delay)) return 'math-max-expression';
  return 'named-or-expression-delay';
}

function classifyTimerDelayBudget(delayKind) {
  if (delayKind === 'numeric-zero') return 'immediate-zero';
  if (delayKind === 'numeric-1-99-ms' || delayKind === 'numeric-100-199-ms') {
    return 'short-under-200ms';
  }
  if (delayKind === 'numeric-200-999-ms') return 'medium-200-999ms';
  if (delayKind === 'numeric-1000-4999-ms' || delayKind === 'numeric-5000-plus-ms') {
    return 'long-1000ms-plus';
  }
  if (delayKind === 'math-max-expression') return 'bounded-expression';
  return 'named-or-expression';
}

function enumerateTimerDelayRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'setTimeout' || row.family === 'setInterval')
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const delaySource = (args[1] || '').replace(/\s+/g, ' ').trim();
      const delayKind = classifyTimerDelay(delaySource);
      const delayBudget = classifyTimerDelayBudget(delayKind);
      return { ...row, delaySource, delayKind, delayBudget };
    });
}

function classifyTimerCallback(callbackSource) {
  if (callbackSource == null) return 'missing-callback-argument';
  const callback = callbackSource.replace(/\s+/g, ' ').trim();
  if (!callback) return 'missing-callback-argument';
  if (/^function\b/.test(callback)) return 'inline-function-callback';
  if (/=>/.test(callback)) return 'inline-arrow-callback';
  if (/\.bind\s*\(/.test(callback)) return 'bound-callback-expression';
  if (/^[A-Za-z_$][\w$]*$/.test(callback)) return 'identifier-callback-reference';
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/.test(callback)) {
    return 'member-callback-reference';
  }
  return 'other-callback-expression';
}

function enumerateTimerCallbackRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'setTimeout' || row.family === 'setInterval')
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const callbackSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      const callbackKind = classifyTimerCallback(callbackSource);
      return { ...row, callbackSource, callbackKind };
    });
}

function extractTimerScheduleHandle(text, callIndex) {
  let index = callIndex - 1;
  if (text[index] === '.') {
    index -= 1;
    while (index >= 0 && /[A-Za-z0-9_$\]]/.test(text[index])) index -= 1;
  }
  while (index >= 0 && /\s/.test(text[index])) index -= 1;
  if (text[index] === '=') {
    index -= 1;
    while (index >= 0 && /\s/.test(text[index])) index -= 1;
    const end = index + 1;
    while (index >= 0 && /[A-Za-z0-9_$.[\]]/.test(text[index])) index -= 1;
    return text.slice(index + 1, end).trim();
  }
  const prefix = text.slice(Math.max(0, callIndex - 220), callIndex);
  const conditionalAssignment = prefix.match(/(?:^|[;\n])\s*(?:const|let|var)?\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=[^;]*\?\s*$/);
  return conditionalAssignment ? conditionalAssignment[1] : '';
}

function classifyTimerScheduleHandle(handleSource, row, callbackSource) {
  if (handleSource) {
    if (handleSource.includes('.')) return 'assigned-property-held-handle';
    if (['id', 'timer', 'timerId', 'timeoutId', 'abortTimer', 'timerRef'].includes(handleSource)) {
      return 'assigned-local-id-handle';
    }
    return 'assigned-named-state-handle';
  }
  const text = read(row.file);
  const prefix = text.slice(Math.max(0, row.sourceIndex - 80), row.sourceIndex);
  if (/return\s+(?:window\.)?$/.test(prefix)) return 'returned-timer-handle';
  if (/new Promise|Promise\./.test(prefix) || /resolve/.test(callbackSource)) {
    return 'promise-sleep-or-timeout';
  }
  return 'fire-and-forget-schedule';
}

function enumerateTimerScheduleRows(family) {
  return enumerateLifecycleInstances()
    .filter(row => row.family === family)
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const callbackSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      const delaySource = (args[1] || '').replace(/\s+/g, ' ').trim();
      const delayKind = classifyTimerDelay(delaySource);
      const handleSource = extractTimerScheduleHandle(text, row.sourceIndex).replace(/\s+/g, ' ').trim();
      const handleKind = classifyTimerScheduleHandle(handleSource, row, callbackSource);
      return { ...row, callbackSource, delaySource, delayKind, handleSource, handleKind };
    });
}

function enumerateTimerClearRows(family) {
  return enumerateLifecycleInstances()
    .filter(row => row.family === family)
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const handleSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      return { ...row, handleSource };
    });
}

function countTimerScheduleClearBySourceFamily(scheduleRows, clearRows) {
  const scheduleByFamily = countBy(scheduleRows, 'sourceFamily');
  const clearByFamily = countBy(clearRows, 'sourceFamily');
  const out = {};
  for (const sourceFamily of Object.keys({ ...scheduleByFamily, ...clearByFamily }).sort()) {
    out[sourceFamily] = {
      schedules: scheduleByFamily[sourceFamily] || 0,
      clears: clearByFamily[sourceFamily] || 0,
      delta: (scheduleByFamily[sourceFamily] || 0) - (clearByFamily[sourceFamily] || 0)
    };
  }
  return out;
}

function countTimerScheduleClearRiskGaps(timeoutRows, clearTimeoutRows, intervalRows, clearIntervalRows) {
  const timeoutScheduleHandles = new Set(timeoutRows.map(row => row.handleSource).filter(Boolean));
  const timeoutClearHandles = new Set(clearTimeoutRows.map(row => row.handleSource).filter(Boolean));
  const intervalScheduleHandles = new Set(intervalRows.map(row => row.handleSource).filter(Boolean));
  const intervalClearHandles = new Set(clearIntervalRows.map(row => row.handleSource).filter(Boolean));

  return {
    timeoutScheduleMinusClear: timeoutRows.length - clearTimeoutRows.length,
    intervalScheduleMinusClear: intervalRows.length - clearIntervalRows.length,
    timeoutClearRowsWithScheduleHandle: clearTimeoutRows.filter(row => timeoutScheduleHandles.has(row.handleSource)).length,
    timeoutClearRowsWithoutDirectScheduleHandle: clearTimeoutRows.filter(row => !timeoutScheduleHandles.has(row.handleSource)).length,
    handledTimeoutScheduleRowsWithClearHandle: timeoutRows.filter(row => (
      row.handleSource && timeoutClearHandles.has(row.handleSource)
    )).length,
    handledTimeoutScheduleRowsWithoutClearHandle: timeoutRows.filter(row => (
      row.handleSource && !timeoutClearHandles.has(row.handleSource)
    )).length,
    distinctScheduledTimeoutHandlesWithoutClear: [...timeoutScheduleHandles].filter(handle => (
      !timeoutClearHandles.has(handle)
    )).length,
    intervalClearRowsWithScheduleHandle: clearIntervalRows.filter(row => (
      intervalScheduleHandles.has(row.handleSource)
    )).length,
    intervalClearRowsWithoutDirectScheduleHandle: clearIntervalRows.filter(row => (
      !intervalScheduleHandles.has(row.handleSource)
    )).length,
    handledIntervalScheduleRowsWithClearHandle: intervalRows.filter(row => (
      row.handleSource && intervalClearHandles.has(row.handleSource)
    )).length,
    handledIntervalScheduleRowsWithoutClearHandle: intervalRows.filter(row => (
      row.handleSource && !intervalClearHandles.has(row.handleSource)
    )).length,
    distinctScheduledIntervalHandlesWithoutClear: [...intervalScheduleHandles].filter(handle => (
      !intervalClearHandles.has(handle)
    )).length
  };
}

function countTimerDelaysBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.delayKind] = (out[row.sourceFamily][row.delayKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countTimerCallbacksBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.callbackKind] = (out[row.sourceFamily][row.callbackKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countTimerSchedulesByOwnerDomain(rows) {
  const out = {};
  for (const row of rows) {
    out[row.owner] ||= { total: 0, setTimeout: 0, setInterval: 0 };
    out[row.owner].total += 1;
    out[row.owner][row.family] += 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countTimerDelayBudgetsByOwnerDomain(rows) {
  const out = {};
  for (const row of rows) {
    out[row.owner] ||= {
      total: 0,
      'immediate-zero': 0,
      'short-under-200ms': 0,
      'medium-200-999ms': 0,
      'long-1000ms-plus': 0,
      'bounded-expression': 0,
      'named-or-expression': 0
    };
    out[row.owner].total += 1;
    out[row.owner][row.delayBudget] += 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function isImmediateOrShortTimerRow(row) {
  return row.delayBudget === 'immediate-zero' || row.delayBudget === 'short-under-200ms';
}

function classifyImmediateShortTimerSideEffect(row) {
  assert.ok(isImmediateOrShortTimerRow(row), `${row.id} is not an immediate/short timer row`);
  const text = read(row.file);
  const context = text.slice(Math.max(0, row.sourceIndex - 900), row.sourceIndex + 900);

  if (row.file === 'js/background.js') {
    if (context.includes('scheduleVideoChannelMapFlush') || context.includes('scheduleVideoMetaMapFlush')) {
      return 'background-map-flush';
    }
  }

  if (row.file === 'js/content_bridge.js') {
    if (context.includes('scheduleWhitelistRefresh')) return 'content-bridge-whitelist-refresh';
    if (context.includes('release focus trap')) return 'content-bridge-native-menu-focus-release';
    if (context.includes('function stampChannelIdentity') || context.includes('__filtertubeStampFallbackState')) {
      return 'content-bridge-stamp-fallback-rerun';
    }
    if (context.includes('applyCollaboratorsToCard') || context.includes('applyCollaboratorsByVideoId')) {
      return 'content-bridge-collaborator-rerun';
    }
    if (context.includes('forceCloseDropdown') && (context.includes('Close dropdown') || context.includes('successDropdown'))) {
      return 'content-bridge-single-channel-menu-close';
    }
    if (context.includes('setTimeout(() => initialize(), 50)')) return 'content-bridge-startup-initialize';
    if (context.includes('scheduleVisibleScan') && context.includes('fallbackMenu')) {
      return 'content-bridge-fallback-menu-scan';
    }
    if (context.includes('pulsePressedState')) return 'content-bridge-playlist-fallback-press';
  }

  if (row.file === 'js/content/bridge_injection.js') {
    if (context.includes('setTimeout(injectNext, 50)')) return 'content-helper-main-world-script-chain';
    if (context.includes('requestSettingsFromBackground')) return 'content-helper-post-injection-settings-refresh';
  }

  if (row.file === 'js/content/first_run_prompt.js' || row.file === 'js/content/release_notes_prompt.js') {
    if (context.includes('container.remove') || context.includes('existing.remove')) {
      return 'content-helper-prompt-dismiss-animation';
    }
  }

  if (row.file === 'js/tab-view.js') {
    if (context.includes('Attach listeners after a short delay')) return 'dashboard-content-filter-listener-bind';
    if (context.includes('input.focus') && context.includes('input.select')) return 'dashboard-dialog-focus';
    if (context.includes('quickAddKeywordBtn') || context.includes('quickAddChannelBtn') || context.includes('quickContentControlsBtn')) {
      return 'dashboard-quick-action-focus';
    }
  }

  if (row.file === 'js/content/dom_fallback.js') {
    if (context.includes('yieldToMain')) return 'dom-fallback-cooperative-yield';
    if (context.includes('runState.pending')) return 'dom-fallback-pending-rerun';
    if (context.includes('findNextAllowedWatchPlaylistLink') || context.includes('ytp-next-button')) {
      return 'dom-fallback-playlist-navigation';
    }
  }

  if (row.file === 'js/filter_logic.js') return 'extension-ui-background-filter-logic-map-flush';
  if (row.file === 'js/render_engine.js') return 'extension-ui-background-render-engine-idle-polyfill';
  if (row.file === 'js/injector.js') return 'injector-engine-readiness-poll';

  if (row.file === 'js/popup.js') {
    if (context.includes('Attach listeners after delay')) return 'popup-content-filter-listener-bind';
    if (context.includes('input.focus') && context.includes('input.select')) return 'popup-dialog-focus';
  }

  if (row.file === 'js/content/block_channel.js') {
    if (context.includes('runQuickBlockFallback')) return 'quick-menu-quick-block-fallback-rerun';
    if (context.includes('function scheduleQuickBlockSweep')) return 'quick-menu-quick-block-sweep';
    if (context.includes('refreshQuickBlockRuntimeState')) return 'quick-menu-runtime-state-refresh';
    if (context.includes('tryInjectIntoVisibleDropdown') || context.includes('scheduleDropdownInjection')) {
      return 'quick-menu-native-dropdown-injection';
    }
    if (context.includes('Menu observer started')) return 'quick-menu-native-menu-body-readiness';
    if (context.includes('setupKidsPassiveBlockListener') || context.includes('tp-yt-paper-toast#toast')) {
      return 'quick-menu-kids-passive-body-readiness';
    }
  }

  if (row.file === 'js/state_manager.js') {
    if (context.includes('scheduleChannelNameEnrichment') || context.includes('processChannelEnrichmentQueue')) {
      return 'state-import-channel-enrichment';
    }
    if (context.includes('runExternalReload') || context.includes('scheduleExternalReload')) {
      return 'state-import-external-reload';
    }
  }

  assert.fail(`Unclassified immediate/short timer row: ${row.id}`);
}

function enumerateImmediateShortTimerContextRows(rows) {
  return rows
    .filter(isImmediateOrShortTimerRow)
    .map(row => ({
      ...row,
      sideEffectClass: classifyImmediateShortTimerSideEffect(row)
    }));
}

function classifyImmediateShortTimerAdmission(sideEffectClass) {
  const admissionMap = {
    'background-map-flush': ['storage-cache-refresh', 'background-cache-write-debounce'],
    'content-bridge-collaborator-rerun': ['dom-rerun-or-scan', 'collaborator-resolution-dom-rerun'],
    'content-bridge-fallback-menu-scan': ['dom-rerun-or-scan', 'fallback-menu-scan-trigger'],
    'content-bridge-native-menu-focus-release': ['user-menu-or-navigation', 'native-menu-close-focus-release'],
    'content-bridge-playlist-fallback-press': ['user-menu-or-navigation', 'fallback-menu-row-click-feedback'],
    'content-bridge-single-channel-menu-close': ['user-menu-or-navigation', 'block-action-menu-close'],
    'content-bridge-stamp-fallback-rerun': ['dom-rerun-or-scan', 'identity-stamp-dom-rerun'],
    'content-bridge-startup-initialize': ['bootstrap-readiness', 'content-bridge-startup-bootstrap'],
    'content-bridge-whitelist-refresh': ['dom-rerun-or-scan', 'whitelist-mode-non-watch-observer'],
    'content-helper-main-world-script-chain': ['bootstrap-readiness', 'main-world-injection-chain'],
    'content-helper-post-injection-settings-refresh': ['bootstrap-readiness', 'post-injection-settings-refresh'],
    'content-helper-prompt-dismiss-animation': ['user-menu-or-navigation', 'content-prompt-dismiss-click'],
    'dashboard-content-filter-listener-bind': ['bootstrap-readiness', 'extension-ui-listener-bootstrap'],
    'dashboard-dialog-focus': ['user-menu-or-navigation', 'extension-ui-dialog-focus'],
    'dashboard-quick-action-focus': ['user-menu-or-navigation', 'dashboard-quick-action-click-focus'],
    'dom-fallback-cooperative-yield': ['dom-rerun-or-scan', 'dom-fallback-active-run-yield'],
    'dom-fallback-pending-rerun': ['dom-rerun-or-scan', 'dom-fallback-pending-coalesced-rerun'],
    'dom-fallback-playlist-navigation': ['user-menu-or-navigation', 'watch-playlist-navigation-action'],
    'extension-ui-background-filter-logic-map-flush': ['storage-cache-refresh', 'page-world-map-message-debounce'],
    'extension-ui-background-render-engine-idle-polyfill': ['bootstrap-readiness', 'idle-polyfill-fallback'],
    'injector-engine-readiness-poll': ['bootstrap-readiness', 'main-world-engine-readiness-poll'],
    'popup-content-filter-listener-bind': ['bootstrap-readiness', 'extension-ui-listener-bootstrap'],
    'popup-dialog-focus': ['user-menu-or-navigation', 'extension-ui-dialog-focus'],
    'quick-menu-kids-passive-body-readiness': ['bootstrap-readiness', 'kids-body-readiness-bootstrap'],
    'quick-menu-native-dropdown-injection': ['user-menu-or-navigation', 'native-dropdown-injection-trigger'],
    'quick-menu-native-menu-body-readiness': ['bootstrap-readiness', 'native-menu-body-readiness-bootstrap'],
    'quick-menu-quick-block-fallback-rerun': ['user-menu-or-navigation', 'quick-block-fallback-action-rerun'],
    'quick-menu-quick-block-sweep': ['dom-rerun-or-scan', 'quick-block-eager-sweep'],
    'quick-menu-runtime-state-refresh': ['user-menu-or-navigation', 'quick-block-global-input-refresh'],
    'state-import-channel-enrichment': ['storage-cache-refresh', 'storage-channel-enrichment'],
    'state-import-external-reload': ['storage-cache-refresh', 'storage-external-reload']
  };
  const admission = admissionMap[sideEffectClass];
  assert.ok(admission, `Unclassified immediate/short timer admission class: ${sideEffectClass}`);
  return {
    admissionFamily: admission[0],
    admissionTriggerClass: admission[1]
  };
}

function enumerateImmediateShortTimerAdmissionRows(rows) {
  return enumerateImmediateShortTimerContextRows(rows)
    .map(row => ({
      ...row,
      ...classifyImmediateShortTimerAdmission(row.sideEffectClass)
    }));
}

function classifyImmediateShortTimerNoWorkPredicate(admissionTriggerClass) {
  const predicateMap = {
    'background-cache-write-debounce': 'storage-dirty-state-gated',
    'block-action-menu-close': 'direct-user-action-gated',
    'collaborator-resolution-dom-rerun': 'dom-fallback-run-inherited',
    'content-bridge-startup-bootstrap': 'bootstrap-readiness-gated',
    'content-prompt-dismiss-click': 'direct-user-action-gated',
    'dashboard-quick-action-click-focus': 'direct-user-action-gated',
    'dom-fallback-active-run-yield': 'dom-fallback-run-inherited',
    'dom-fallback-pending-coalesced-rerun': 'dom-fallback-run-inherited',
    'extension-ui-dialog-focus': 'direct-user-action-gated',
    'extension-ui-listener-bootstrap': 'bootstrap-readiness-gated',
    'fallback-menu-row-click-feedback': 'direct-user-action-gated',
    'fallback-menu-scan-trigger': 'eager-surface-gated',
    'identity-stamp-dom-rerun': 'dom-fallback-run-inherited',
    'idle-polyfill-fallback': 'bootstrap-readiness-gated',
    'kids-body-readiness-bootstrap': 'bootstrap-readiness-gated',
    'main-world-engine-readiness-poll': 'bootstrap-readiness-gated',
    'main-world-injection-chain': 'bootstrap-readiness-gated',
    'native-dropdown-injection-trigger': 'direct-user-action-gated',
    'native-menu-body-readiness-bootstrap': 'bootstrap-readiness-gated',
    'native-menu-close-focus-release': 'direct-user-action-gated',
    'page-world-map-message-debounce': 'storage-dirty-state-gated',
    'post-injection-settings-refresh': 'bootstrap-readiness-gated',
    'quick-block-eager-sweep': 'eager-surface-gated',
    'quick-block-fallback-action-rerun': 'direct-user-action-gated',
    'quick-block-global-input-refresh': 'page-global-user-input-gated',
    'storage-channel-enrichment': 'storage-dirty-state-gated',
    'storage-external-reload': 'storage-dirty-state-gated',
    'watch-playlist-navigation-action': 'direct-user-action-gated',
    'whitelist-mode-non-watch-observer': 'explicit-list-mode-route-gated'
  };
  const activePredicateClass = predicateMap[admissionTriggerClass];
  assert.ok(activePredicateClass, `Unclassified immediate/short timer no-work predicate: ${admissionTriggerClass}`);
  return activePredicateClass;
}

function enumerateImmediateShortTimerNoWorkRows(rows) {
  return enumerateImmediateShortTimerAdmissionRows(rows)
    .map(row => ({
      ...row,
      activePredicateClass: classifyImmediateShortTimerNoWorkPredicate(row.admissionTriggerClass)
    }));
}

function classifyImmediateShortTimerSurface(row) {
  assert.ok(isImmediateOrShortTimerRow(row), `${row.id} is not an immediate/short timer row`);
  if (
    row.file === 'js/content_bridge.js' ||
    row.file === 'js/content/dom_fallback.js' ||
    row.file === 'js/content/block_channel.js' ||
    row.file === 'js/content/bridge_injection.js' ||
    row.file === 'js/filter_logic.js' ||
    row.file === 'js/injector.js'
  ) {
    return 'youtube-spa-content-runtime';
  }
  if (row.file === 'js/content/first_run_prompt.js' || row.file === 'js/content/release_notes_prompt.js') {
    return 'content-prompt-overlay';
  }
  if (row.file === 'js/tab-view.js') return 'extension-dashboard-ui';
  if (row.file === 'js/popup.js') return 'extension-popup-ui';
  if (row.file === 'js/background.js') return 'background-storage-runtime';
  if (row.file === 'js/state_manager.js') return 'state-import-runtime';
  if (row.file === 'js/render_engine.js') return 'extension-ui-render-engine';

  assert.fail(`Unclassified immediate/short timer surface: ${row.id}`);
}

function enumerateImmediateShortTimerSurfaceRows(rows) {
  return enumerateImmediateShortTimerNoWorkRows(rows)
    .map(row => ({
      ...row,
      surfaceClass: classifyImmediateShortTimerSurface(row)
    }));
}

function classifyBackgroundTimerReason(row) {
  assert.equal(row.file, 'js/background.js', `${row.id} is not a background timer row`);
  const backgroundFile = 'js/background.js';
  const exactLineReasons = new Map([
    [lineOfAfter(backgroundFile, 'function revokeBackgroundBlobUrlLater', 'setTimeout('), 'backup-blob-url-revoke-delay'],
    [lineOfAfter(backgroundFile, 'function scheduleAutoBackupInBackground', 'clearTimeout(autoBackupTimer)'), 'auto-backup-debounce-clear'],
    [lineOfAfter(backgroundFile, 'function scheduleAutoBackupInBackground', 'autoBackupTimer = setTimeout('), 'auto-backup-debounce-schedule'],
    [lineOfAfter(backgroundFile, 'function waitForPostBlockEnrichmentBeforeBackup', 'new Promise(resolve => setTimeout(resolve, timeoutMs))'), 'post-block-enrichment-wait-cap'],
    [lineOfAfter(backgroundFile, 'const run = postBlockEnrichmentWorker', 'setTimeout(resolve, delayMs)'), 'post-block-enrichment-jitter'],
    [lineOfAfter(backgroundFile, 'function scheduleChannelMapFlush', 'channelMapFlushTimer = setTimeout('), 'channel-map-flush-debounce'],
    [lineOfAfter(backgroundFile, 'function scheduleVideoChannelMapFlush', 'videoChannelMapFlushTimer = setTimeout('), 'video-channel-map-flush-debounce'],
    [lineOfAfter(backgroundFile, 'function scheduleVideoMetaMapFlush', 'videoMetaMapFlushTimer = setTimeout('), 'video-meta-map-flush-debounce'],
    [lineOfAfter(backgroundFile, 'async function performShortsIdentityFetch', 'const timeoutId = setTimeout('), 'shorts-fetch-abort-schedule'],
    [lineOfAfter(backgroundFile, 'async function performShortsIdentityFetch', 'clearTimeout(timeoutId)'), 'shorts-fetch-abort-clear'],
    [lineOfAfter(backgroundFile, 'async function performKidsWatchIdentityFetch', 'const timeoutId = setTimeout('), 'kids-watch-fetch-abort-schedule'],
    [lineOfAfter(backgroundFile, 'async function performKidsWatchIdentityFetch', 'clearTimeout(timeoutId)'), 'kids-watch-fetch-abort-clear'],
    [lineOfAfter(backgroundFile, 'async function performWatchIdentityFetch', 'const timeoutId = setTimeout('), 'watch-fetch-abort-schedule'],
    [lineOfAfter(backgroundFile, 'async function performWatchIdentityFetch', 'clearTimeout(timeoutId)'), 'watch-fetch-abort-clear']
  ]);
  if (exactLineReasons.has(row.line)) return exactLineReasons.get(row.line);

  const text = read(row.file);
  const context = text.slice(Math.max(0, row.sourceIndex - 700), row.sourceIndex + 700);
  const isClear = row.family === 'clearTimeout';

  if (/function revokeBackgroundBlobUrlLater/.test(context) || /URL\.revokeObjectURL/.test(context)) {
    return 'backup-blob-url-revoke-delay';
  }
  if (/function scheduleAutoBackupInBackground/.test(context) || /autoBackupTimer/.test(context)) {
    return isClear ? 'auto-backup-debounce-clear' : 'auto-backup-debounce-schedule';
  }
  if (/function waitForPostBlockEnrichmentBeforeBackup/.test(context) || /Promise\.race/.test(context)) {
    return 'post-block-enrichment-wait-cap';
  }
  if (/postBlockEnrichmentWorker/.test(context) || /delayMs = 3500/.test(context)) {
    return 'post-block-enrichment-jitter';
  }
  if (/function scheduleChannelMapFlush/.test(context) || /channelMapFlushTimer/.test(context)) {
    return 'channel-map-flush-debounce';
  }
  if (/function scheduleVideoChannelMapFlush/.test(context) || /videoChannelMapFlushTimer/.test(context)) {
    return 'video-channel-map-flush-debounce';
  }
  if (/function scheduleVideoMetaMapFlush/.test(context) || /videoMetaMapFlushTimer/.test(context)) {
    return 'video-meta-map-flush-debounce';
  }
  if (/function performShortsIdentityFetch/.test(context) || /\/shorts\/\$/.test(context)) {
    return isClear ? 'shorts-fetch-abort-clear' : 'shorts-fetch-abort-schedule';
  }
  if (/function performKidsWatchIdentityFetch/.test(context) || /youtubekids\.com\/watch/.test(context)) {
    return isClear ? 'kids-watch-fetch-abort-clear' : 'kids-watch-fetch-abort-schedule';
  }
  if (/function performWatchIdentityFetch/.test(context) || /youtube\.com\/watch/.test(context)) {
    return isClear ? 'watch-fetch-abort-clear' : 'watch-fetch-abort-schedule';
  }
  return 'unclassified-background-timer';
}

function classifyBackgroundTimerDomain(reason) {
  if (/^backup-|^auto-backup/.test(reason)) return 'backup-download-lifecycle';
  if (/^post-block-enrichment/.test(reason)) return 'post-block-enrichment-lifecycle';
  if (/map-flush-debounce$/.test(reason)) return 'identity-map-flush-lifecycle';
  if (/-fetch-abort-/.test(reason)) return 'identity-fetch-network-timeout';
  return 'unclassified-background-timer-domain';
}

function enumerateBackgroundTimerOwnerRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.file === 'js/background.js')
    .filter(row => row.family === 'setTimeout' || row.family === 'clearTimeout')
    .map((row) => {
      const reason = classifyBackgroundTimerReason(row);
      return {
        ...row,
        reason,
        domain: classifyBackgroundTimerDomain(reason)
      };
    });
}

function countBackgroundTimersByDomain(rows) {
  const out = {};
  for (const row of rows) {
    out[row.domain] ||= { total: 0, schedules: 0, clears: 0 };
    out[row.domain].total += 1;
    if (row.family === 'setTimeout') out[row.domain].schedules += 1;
    if (row.family === 'clearTimeout') out[row.domain].clears += 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function enumerateGeneratedVendorLifecycleFreshnessRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.sourceFamily === 'vendor-bundles' || row.sourceFamily === 'generated-ui-output')
    .map((row) => ({
      ...row,
      freshnessClass: row.sourceFamily === 'vendor-bundles'
        ? 'vendor-bundle-lifecycle'
        : 'generated-shell-output-lifecycle'
    }));
}

function countGeneratedVendorLifecycleByFreshnessClass(rows) {
  const out = {};
  for (const row of rows) {
    out[row.freshnessClass] ||= { total: 0, addEventListener: 0, removeEventListener: 0 };
    out[row.freshnessClass].total += 1;
    out[row.freshnessClass][row.family] = (out[row.freshnessClass][row.family] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyWebsiteComponentLifecycleDomain(row) {
  if (row.file === 'website/components/scene-controller.js') return 'website-scene-scheduler-lifecycle';
  if (row.file === 'website/components/theme-toggle.js') return 'website-theme-sync-lifecycle';
  return 'website-other-lifecycle';
}

function enumerateWebsiteComponentLifecycleBoundaryRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.sourceFamily === 'website-components')
    .map((row) => ({
      ...row,
      websiteLifecycleDomain: classifyWebsiteComponentLifecycleDomain(row)
    }));
}

function countWebsiteComponentLifecycleByDomain(rows) {
  const out = {};
  for (const row of rows) {
    out[row.websiteLifecycleDomain] ||= {
      total: 0,
      installOrSchedule: 0,
      explicitTeardown: 0,
      addEventListener: 0,
      cancelAnimationFrame: 0,
      removeEventListener: 0,
      intersectionObserver: 0,
      mutationObserver: 0,
      requestAnimationFrame: 0,
      setTimeout: 0,
      clearTimeout: 0
    };
    out[row.websiteLifecycleDomain].total += 1;
    out[row.websiteLifecycleDomain][lifecycleRole(row.family) === 'install-or-schedule'
      ? 'installOrSchedule'
      : 'explicitTeardown'] += 1;
    out[row.websiteLifecycleDomain][row.family] += 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyContentRuntimePageGlobalListenerDomain(row) {
  if (row.file === 'js/content/block_channel.js') {
    if (row.line < 2310) return 'quick-block-global-lifecycle';
    if (row.line < 2595) return 'native-menu-global-lifecycle';
    return 'kids-passive-menu-lifecycle';
  }
  if (row.file === 'js/content_bridge.js') {
    if (row.line < 1300) return 'content-bridge-prefetch-whitelist-lifecycle';
    if (row.line < 6500) return 'content-bridge-dom-fallback-lifecycle';
    if (row.line < 8000) return 'content-bridge-fallback-menu-lifecycle';
    return 'content-bridge-main-world-message-lifecycle';
  }
  if (row.file === 'js/content/bridge_settings.js') return 'settings-bridge-page-message-lifecycle';
  if (row.file === 'js/content/collab_dialog.js') return 'collab-dialog-page-trigger-lifecycle';
  if (row.file === 'js/content/dom_fallback.js') return 'dom-fallback-page-lifecycle';
  if (row.file === 'js/content/first_run_prompt.js' || row.file === 'js/content/release_notes_prompt.js') {
    return 'prompt-page-boot-lifecycle';
  }
  if (row.file === 'js/injector.js') return 'injector-main-world-message-lifecycle';
  return 'other-content-runtime-page-global-lifecycle';
}

function classifyContentRuntimePageGlobalRouteScope(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'main-youtube-all-spa-routes';
  if (domain === 'native-menu-global-lifecycle') return 'main-youtube-native-menu-routes';
  if (domain === 'kids-passive-menu-lifecycle') return 'youtube-kids-native-menu-routes';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') {
    if (row.line < 1170) return 'main-youtube-prefetch-visibility-route';
    if (row.line < 1220) return 'main-youtube-watch-playlist-panel-routes';
    return 'main-youtube-whitelist-non-watch-spa-routes';
  }
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'main-youtube-dom-fallback-body-route';
  if (domain === 'content-bridge-fallback-menu-lifecycle') {
    if (row.line >= 7600) return 'main-youtube-playlist-fallback-popover-route';
    return 'main-youtube-fallback-menu-routes';
  }
  if (domain === 'content-bridge-main-world-message-lifecycle') return 'main-youtube-content-bridge-message-route';
  if (domain === 'settings-bridge-page-message-lifecycle') return 'main-youtube-bridge-settings-message-route';
  if (domain === 'collab-dialog-page-trigger-lifecycle') return 'main-youtube-collab-dialog-routes';
  if (domain === 'dom-fallback-page-lifecycle') {
    if (row.line < 2300) return 'main-youtube-dom-fallback-scroll-route';
    return 'main-youtube-watch-playlist-guard-route';
  }
  if (domain === 'prompt-page-boot-lifecycle') return 'extension-prompt-overlay-route';
  if (domain === 'injector-main-world-message-lifecycle') return 'main-youtube-injector-message-route';
  return 'unclassified-route-scope';
}

function classifyContentRuntimePageGlobalSurfaceScope(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'quick-block-card-affordance-surface';
  if (domain === 'native-menu-global-lifecycle') return 'native-dropdown-menu-surface';
  if (domain === 'kids-passive-menu-lifecycle') return 'kids-native-menu-surface';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') {
    if (row.line < 1170) return 'identity-prefetch-visibility-surface';
    if (row.line < 1220) return 'playlist-panel-prefetch-surface';
    return 'whitelist-right-rail-surface';
  }
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'dom-fallback-body-observer-surface';
  if (domain === 'content-bridge-fallback-menu-lifecycle') {
    if (row.line >= 7600) return 'playlist-fallback-popover-surface';
    return 'fallback-menu-card-surface';
  }
  if (domain === 'content-bridge-main-world-message-lifecycle') return 'content-bridge-page-message-surface';
  if (domain === 'settings-bridge-page-message-lifecycle') return 'bridge-settings-page-message-surface';
  if (domain === 'collab-dialog-page-trigger-lifecycle') return 'collab-dialog-trigger-surface';
  if (domain === 'dom-fallback-page-lifecycle') {
    if (row.line < 2300) return 'dom-fallback-scroll-state-surface';
    return 'watch-playlist-playback-guard-surface';
  }
  if (domain === 'prompt-page-boot-lifecycle') return 'prompt-overlay-boot-surface';
  if (domain === 'injector-main-world-message-lifecycle') return 'injector-page-message-surface';
  return 'unclassified-surface-scope';
}

function classifyContentRuntimePageGlobalPredicateClass(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'quick-block-enabled-gated';
  if (domain === 'native-menu-global-lifecycle') return 'native-menu-listener-gated';
  if (domain === 'kids-passive-menu-lifecycle') return 'kids-native-menu-listener-gated';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') {
    if (row.line < 1220) return 'identity-prefetch-work-gated';
    return 'whitelist-mode-non-watch-gated';
  }
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'fallback-lifecycle-work-gated';
  if (domain === 'content-bridge-fallback-menu-lifecycle') {
    if (row.line >= 7600) return 'playlist-popover-open-gated';
    return 'fallback-menu-eager-or-hover-gated';
  }
  if (
    domain === 'content-bridge-main-world-message-lifecycle' ||
    domain === 'injector-main-world-message-lifecycle'
  ) {
    return 'main-world-message-source-gated';
  }
  if (domain === 'settings-bridge-page-message-lifecycle') {
    return row.eventKind === 'message'
      ? 'main-world-message-source-gated'
      : 'seed-ready-pending-settings-gated';
  }
  if (domain === 'collab-dialog-page-trigger-lifecycle') return 'collab-runtime-enabled-gated';
  if (domain === 'dom-fallback-page-lifecycle') {
    if (row.line < 2300) return 'dom-fallback-scroll-state-gated';
    return 'dom-fallback-playlist-guard-gated';
  }
  if (domain === 'prompt-page-boot-lifecycle') return 'prompt-needed-check-gated';
  return 'unclassified-predicate-class';
}

function classifyContentRuntimePageGlobalDuplicateGuard(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'quick-block-module-flag';
  if (domain === 'native-menu-global-lifecycle') return 'native-menu-script-load-singleton';
  if (domain === 'kids-passive-menu-lifecycle') return 'kids-passive-script-load-singleton';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') {
    if (row.line < 1170) return 'prefetch-observer-singleton';
    if (row.line < 1220) return 'playlist-prefetch-hook-flag';
    return 'right-rail-whitelist-observer-flag';
  }
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'fallback-mutation-observer-active-flag';
  if (domain === 'content-bridge-fallback-menu-lifecycle') {
    if (row.line >= 7600) return 'playlist-popover-replace-remove';
    return 'fallback-menu-installed-flag';
  }
  if (domain === 'content-bridge-main-world-message-lifecycle') return 'content-bridge-script-load-singleton';
  if (domain === 'settings-bridge-page-message-lifecycle') {
    return row.eventKind === 'message'
      ? 'bridge-settings-window-message-flag'
      : 'bridge-settings-seed-listener-flag';
  }
  if (domain === 'collab-dialog-page-trigger-lifecycle') {
    return row.eventKind === 'DOMContentLoaded'
      ? 'collab-domcontentloaded-boot'
      : 'collab-listener-module-flag';
  }
  if (domain === 'dom-fallback-page-lifecycle') {
    if (row.line < 2300) return 'dom-fallback-scroll-window-flag';
    if (row.eventKind === 'click') return 'dom-fallback-playlist-nav-guard-flag';
    return 'dom-fallback-autoplay-guard-flag';
  }
  if (domain === 'prompt-page-boot-lifecycle') return 'prompt-domcontentloaded-once';
  if (domain === 'injector-main-world-message-lifecycle') {
    return row.line < 100
      ? 'injector-window-message-flag'
      : 'injector-script-load-singleton';
  }
  return 'unclassified-duplicate-guard';
}

function classifyContentRuntimePageGlobalNativeMenuImpact(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'quick-block-affordance-impact';
  if (domain === 'native-menu-global-lifecycle') return 'youtube-native-menu-impact';
  if (domain === 'kids-passive-menu-lifecycle') return 'youtube-kids-native-menu-impact';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') return 'prefetch-or-whitelist-impact';
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'dom-fallback-observer-impact';
  if (domain === 'content-bridge-fallback-menu-lifecycle') return 'custom-fallback-menu-impact';
  if (
    domain === 'content-bridge-main-world-message-lifecycle' ||
    domain === 'settings-bridge-page-message-lifecycle' ||
    domain === 'injector-main-world-message-lifecycle'
  ) {
    return 'page-message-impact';
  }
  if (domain === 'collab-dialog-page-trigger-lifecycle') return 'collaborator-dialog-trigger-impact';
  if (domain === 'dom-fallback-page-lifecycle') return 'playback-or-scroll-guard-impact';
  if (domain === 'prompt-page-boot-lifecycle') return 'prompt-overlay-impact';
  return 'unclassified-native-menu-impact';
}

function classifyContentRuntimePageGlobalPageMessageTrustImpact(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'content-bridge-main-world-message-lifecycle') return 'content-bridge-main-world-message-trust';
  if (domain === 'settings-bridge-page-message-lifecycle') {
    return row.eventKind === 'message'
      ? 'bridge-settings-window-message-trust'
      : 'seed-ready-event-trust';
  }
  if (domain === 'injector-main-world-message-lifecycle') {
    return row.line < 100
      ? 'injector-subscription-import-message-trust'
      : 'injector-runtime-lookup-message-trust';
  }
  return 'no-page-message-trust-impact';
}

function classifyContentRuntimePageGlobalNoWorkBudget(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'quick-block-enabled-no-work-budget';
  if (domain === 'native-menu-global-lifecycle') return 'native-menu-open-no-work-budget';
  if (domain === 'kids-passive-menu-lifecycle') return 'kids-native-menu-no-work-budget';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') {
    if (row.line < 1220) return 'identity-prefetch-no-work-budget';
    return 'whitelist-non-watch-no-work-budget';
  }
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'fallback-lifecycle-no-work-budget';
  if (domain === 'content-bridge-fallback-menu-lifecycle') {
    if (row.line >= 7600) return 'playlist-popover-no-work-budget';
    return 'fallback-menu-hover-eager-no-work-budget';
  }
  if (
    domain === 'content-bridge-main-world-message-lifecycle' ||
    domain === 'injector-main-world-message-lifecycle' ||
    (domain === 'settings-bridge-page-message-lifecycle' && row.eventKind === 'message')
  ) {
    return 'page-message-no-work-budget';
  }
  if (domain === 'settings-bridge-page-message-lifecycle') return 'seed-ready-no-work-budget';
  if (domain === 'collab-dialog-page-trigger-lifecycle') return 'collab-runtime-no-work-budget';
  if (domain === 'dom-fallback-page-lifecycle') {
    if (row.line < 2300) return 'scroll-state-no-work-budget';
    return 'playback-guard-no-work-budget';
  }
  if (domain === 'prompt-page-boot-lifecycle') return 'prompt-needed-no-work-budget';
  return 'unclassified-no-work-budget';
}

function classifyContentRuntimePageGlobalPositiveFixture(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'positive-fixture-card-affordance-refresh';
  if (domain === 'native-menu-global-lifecycle') return 'positive-fixture-native-menu-open-close';
  if (domain === 'kids-passive-menu-lifecycle') return 'positive-fixture-kids-native-block-sync';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') {
    if (row.line < 1220) return 'positive-fixture-visible-card-prefetch';
    return 'positive-fixture-whitelist-spa-refresh';
  }
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'positive-fixture-late-body-fallback-boot';
  if (domain === 'content-bridge-fallback-menu-lifecycle') {
    if (row.line >= 7600) return 'positive-fixture-playlist-popover-close';
    return 'positive-fixture-fallback-menu-scan';
  }
  if (
    domain === 'content-bridge-main-world-message-lifecycle' ||
    domain === 'settings-bridge-page-message-lifecycle' ||
    domain === 'injector-main-world-message-lifecycle'
  ) {
    return 'positive-fixture-page-message-relay';
  }
  if (domain === 'collab-dialog-page-trigger-lifecycle') return 'positive-fixture-collab-trigger-dialog';
  if (domain === 'dom-fallback-page-lifecycle') {
    if (row.line < 2300) return 'positive-fixture-scroll-state-refresh';
    return 'positive-fixture-playlist-playback-guard';
  }
  if (domain === 'prompt-page-boot-lifecycle') return 'positive-fixture-prompt-needed-overlay';
  return 'unclassified-positive-fixture';
}

function classifyContentRuntimePageGlobalNegativeFixture(row) {
  const domain = row.contentRuntimePageGlobalDomain;
  if (domain === 'quick-block-global-lifecycle') return 'negative-fixture-no-card-affordance-when-disabled';
  if (domain === 'native-menu-global-lifecycle') return 'negative-fixture-no-native-menu-poison';
  if (domain === 'kids-passive-menu-lifecycle') return 'negative-fixture-no-kids-main-cross-talk';
  if (domain === 'content-bridge-prefetch-whitelist-lifecycle') {
    if (row.line < 1220) return 'negative-fixture-no-prefetch-when-rules-inactive';
    return 'negative-fixture-no-whitelist-watch-route-refresh';
  }
  if (domain === 'content-bridge-dom-fallback-lifecycle') return 'negative-fixture-no-fallback-observer-when-inactive';
  if (domain === 'content-bridge-fallback-menu-lifecycle') {
    if (row.line >= 7600) return 'negative-fixture-popover-outside-click-only';
    return 'negative-fixture-no-fallback-menu-when-native-quiet';
  }
  if (
    domain === 'content-bridge-main-world-message-lifecycle' ||
    domain === 'settings-bridge-page-message-lifecycle' ||
    domain === 'injector-main-world-message-lifecycle'
  ) {
    return 'negative-fixture-reject-untrusted-page-message';
  }
  if (domain === 'collab-dialog-page-trigger-lifecycle') return 'negative-fixture-no-collab-dialog-when-disabled';
  if (domain === 'dom-fallback-page-lifecycle') return 'negative-fixture-no-playback-guard-off-route';
  if (domain === 'prompt-page-boot-lifecycle') return 'negative-fixture-no-prompt-duplicate-overlay';
  return 'unclassified-negative-fixture';
}

function classifyContentRuntimePageGlobalPageLifetimeJustification(row) {
  if (row.file === 'js/content/block_channel.js' && row.eventKind === 'pointermove') {
    return 'transient-pointermove-remove';
  }
  if (
    row.contentRuntimePageGlobalDomain === 'content-bridge-fallback-menu-lifecycle' &&
    row.line >= 7600
  ) {
    return 'transient-popover-remove';
  }
  if (
    row.eventKind === 'DOMContentLoaded' &&
    (
      row.file === 'js/content/block_channel.js' ||
      row.file === 'js/content_bridge.js' ||
      row.file === 'js/content/first_run_prompt.js' ||
      row.file === 'js/content/release_notes_prompt.js'
    )
  ) {
    return 'one-shot-boot-listener';
  }
  if (
    row.contentRuntimePageGlobalDomain === 'content-bridge-main-world-message-lifecycle' ||
    row.contentRuntimePageGlobalDomain === 'injector-main-world-message-lifecycle' ||
    (row.contentRuntimePageGlobalDomain === 'settings-bridge-page-message-lifecycle' && row.eventKind === 'message')
  ) {
    return 'page-world-message-singleton';
  }
  if (row.contentRuntimePageGlobalDomain === 'settings-bridge-page-message-lifecycle') {
    return 'seed-ready-singleton';
  }
  return 'module-singleton-page-lifetime';
}

function enumerateContentRuntimePageGlobalListenerRows() {
  return enumerateAddEventListenerEventTargetRows()
    .filter(row => row.sourceFamily === 'content-runtime-js')
    .filter(row => row.targetKind === 'document' || row.targetKind === 'window')
    .map((row) => {
      const withDomain = {
        ...row,
        contentRuntimePageGlobalDomain: classifyContentRuntimePageGlobalListenerDomain(row)
      };
      return {
        ...withDomain,
        routeScope: classifyContentRuntimePageGlobalRouteScope(withDomain),
        surfaceScope: classifyContentRuntimePageGlobalSurfaceScope(withDomain),
        predicateClass: classifyContentRuntimePageGlobalPredicateClass(withDomain),
        duplicateGuardClass: classifyContentRuntimePageGlobalDuplicateGuard(withDomain),
        nativeMenuImpactClass: classifyContentRuntimePageGlobalNativeMenuImpact(withDomain),
        pageMessageTrustImpactClass: classifyContentRuntimePageGlobalPageMessageTrustImpact(withDomain),
        noWorkBudgetClass: classifyContentRuntimePageGlobalNoWorkBudget(withDomain),
        positiveFixtureClass: classifyContentRuntimePageGlobalPositiveFixture(withDomain),
        negativeFixtureClass: classifyContentRuntimePageGlobalNegativeFixture(withDomain),
        pageLifetimeJustificationClass: classifyContentRuntimePageGlobalPageLifetimeJustification(withDomain)
      };
    });
}

function countContentRuntimePageGlobalByDomain(rows) {
  const out = {};
  for (const row of rows) {
    out[row.contentRuntimePageGlobalDomain] ||= {
      total: 0,
      document: 0,
      window: 0
    };
    out[row.contentRuntimePageGlobalDomain].total += 1;
    if (row.targetKind === 'document') out[row.contentRuntimePageGlobalDomain].document += 1;
    if (row.targetKind === 'window') out[row.contentRuntimePageGlobalDomain].window += 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function classifyExplicitTeardownHandle(row, handleSource, targetKind = '') {
  if (row.family === 'removeEventListener') {
    if (targetKind === 'document') return 'listener-document-target';
    if (targetKind === 'window') return 'listener-window-target';
    if (targetKind === 'generated-shell-node') return 'listener-generated-shell-target';
    return 'listener-other-target';
  }
  if (row.family === 'clearTimeout') {
    if (handleSource.includes('.')) return 'timeout-property-held-handle';
    if (['id', 'timerId', 'timeoutId', 'abortTimer', 'timerRef'].includes(handleSource)) {
      return 'timeout-local-id-handle';
    }
    return 'timeout-named-state-handle';
  }
  if (row.family === 'clearInterval') {
    if (handleSource === 'engineCheckInterval') return 'interval-engine-check-handle';
    if (handleSource === 'warmupTimer') return 'interval-warmup-handle';
    if (handleSource === 'dashboardStatsRotationTimer') return 'interval-dashboard-rotation-handle';
    return 'interval-other-handle';
  }
  if (row.family === 'cancelAnimationFrame') {
    if (handleSource === 'profileDropdownPositionRaf') return 'frame-profile-dropdown-handle';
    if (handleSource === 'positionRaf') return 'frame-position-handle';
    return 'frame-other-handle';
  }
  return 'other-explicit-teardown-handle';
}

function enumerateExplicitTeardownRows() {
  return enumerateLifecycleInstances()
    .filter(row => lifecycleRole(row.family) === 'explicit-teardown')
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      let handleSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      let targetKind = '';
      if (row.family === 'removeEventListener') {
        const target = extractAddEventListenerTarget(text, row.sourceIndex);
        targetKind = classifyAddEventListenerTarget(target.targetSource, target.optionalChain);
        handleSource = target.targetSource;
      }
      const handleKind = classifyExplicitTeardownHandle(row, handleSource, targetKind);
      return { ...row, handleSource, targetKind, handleKind };
    });
}

function countExplicitTeardownBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.handleKind] = (out[row.sourceFamily][row.handleKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function extractAssignedHandleBeforeCall(text, callIndex) {
  let index = callIndex - 1;
  while (index >= 0 && /\s/.test(text[index])) index -= 1;
  if (text[index] !== '=') return '';
  index -= 1;
  while (index >= 0 && /\s/.test(text[index])) index -= 1;
  const end = index + 1;
  while (index >= 0 && /[A-Za-z0-9_$.[\]]/.test(text[index])) index -= 1;
  return text.slice(index + 1, end).trim();
}

function classifyAnimationFrameSchedule(callbackSource, handleSource) {
  if (handleSource) return 'assigned-positioning-frame-handle';
  if (/scrollIntoView\s*\(/.test(callbackSource)) return 'inline-scroll-into-view-frame';
  if (/^[A-Za-z_$][\w$]*$/.test(callbackSource)) return 'identifier-callback-frame';
  if (/setTimeout\s*\(/.test(callbackSource)) return 'inline-timeout-hop-frame';
  return 'inline-anonymous-frame';
}

function enumerateAnimationFrameScheduleRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'requestAnimationFrame')
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const callbackSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      const handleSource = extractAssignedHandleBeforeCall(text, row.sourceIndex);
      const frameScheduleKind = classifyAnimationFrameSchedule(callbackSource, handleSource);
      return { ...row, callbackSource, handleSource, frameScheduleKind };
    });
}

function countAnimationFrameSchedulesBySourceFamily(rows) {
  const out = {};
  for (const row of rows) {
    out[row.sourceFamily] ||= { total: 0 };
    out[row.sourceFamily].total += 1;
    out[row.sourceFamily][row.frameScheduleKind] = (out[row.sourceFamily][row.frameScheduleKind] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function enumerateAnimationFrameCancelRows() {
  return enumerateLifecycleInstances()
    .filter(row => row.family === 'cancelAnimationFrame')
    .map((row) => {
      const text = read(row.file);
      const openParenIndex = text.indexOf('(', row.sourceIndex);
      const args = splitTopLevelArgs(extractCallArgs(text, openParenIndex));
      const handleSource = (args[0] || '').replace(/\s+/g, ' ').trim();
      const handleKind = classifyExplicitTeardownHandle(row, handleSource);
      return { ...row, handleSource, handleKind };
    });
}

function countAnimationFrameScheduleCancelBySourceFamily(scheduleRows, cancelRows) {
  const out = {};
  for (const row of scheduleRows) {
    out[row.sourceFamily] ||= { schedules: 0, cancels: 0, delta: 0 };
    out[row.sourceFamily].schedules += 1;
    if (!row.handleSource) {
      out[row.sourceFamily].schedulesWithoutHandle = (out[row.sourceFamily].schedulesWithoutHandle || 0) + 1;
    }
  }
  for (const row of cancelRows) {
    out[row.sourceFamily] ||= { schedules: 0, cancels: 0, delta: 0 };
    out[row.sourceFamily].cancels += 1;
  }
  for (const value of Object.values(out)) {
    value.delta = value.schedules - value.cancels;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countAnimationFrameScheduleCancelRiskGaps(scheduleRows, cancelRows) {
  const scheduleHandles = new Set(scheduleRows.map(row => row.handleSource).filter(Boolean));
  const cancelHandles = new Set(cancelRows.map(row => row.handleSource).filter(Boolean));
  return {
    frameScheduleMinusCancel: scheduleRows.length - cancelRows.length,
    frameSchedulesWithoutHandle: scheduleRows.filter(row => !row.handleSource).length,
    frameSchedulesWithAssignedHandle: scheduleRows.filter(row => row.handleSource).length,
    frameCancelRowsWithScheduleHandle: cancelRows.filter(row => scheduleHandles.has(row.handleSource)).length,
    frameCancelRowsWithoutDirectScheduleHandle: cancelRows.filter(row => !scheduleHandles.has(row.handleSource)).length,
    handledFrameScheduleRowsWithCancelHandle: scheduleRows.filter(row => (
      row.handleSource && cancelHandles.has(row.handleSource)
    )).length,
    handledFrameScheduleRowsWithoutCancelHandle: scheduleRows.filter(row => (
      row.handleSource && !cancelHandles.has(row.handleSource)
    )).length,
    distinctScheduledFrameHandlesWithoutCancel: [...scheduleHandles].filter(handle => (
      !cancelHandles.has(handle)
    )).length
  };
}

test('lifecycle instance register documents source boundary and proof status', () => {
  const doc = read(registerPath);

  assert.match(doc, /Status: source-derived audit register/);
  assert.match(doc, /Completion is not proven/);
  assert.match(doc, /not-ready-for-behavior-change/);
  assert.match(doc, /git ls-files '\*\.js' '\*\.jsx' '\*\.mjs'/);
  assert.match(doc, /ignored root HTML\/JSON\/TXT captures/i);
  assert.match(doc, /tests\/runtime\/lifecycle-instance-register-current-behavior\.test\.mjs/);
});

test('lifecycle instance register enumerates every current observer listener timer and frame instance', () => {
  const rows = enumerateLifecycleInstances();
  const addListenerOptionRows = enumerateAddEventListenerOptionRows();
  const addListenerEventRows = enumerateAddEventListenerEventRows();
  const addListenerTargetRows = enumerateAddEventListenerTargetRows();
  const addListenerEventTargetRows = enumerateAddEventListenerEventTargetRows();
  const addListenerCallbackRows = enumerateAddEventListenerCallbackRows();
  const listenerAddRows = enumerateEventListenerRows('addEventListener');
  const listenerRemoveRows = enumerateEventListenerRows('removeEventListener');
  const listenerAddRemoveRiskGaps = countListenerAddRemoveRiskGaps(listenerAddRows, listenerRemoveRows);
  const observerConstructorRows = rows.filter(row => (
    row.family === 'mutationObserver' ||
    row.family === 'intersectionObserver'
  ));
  const observerConstructorCallbackRows = enumerateObserverConstructorCallbackRows(observerConstructorRows);
  const observerObserveRows = enumerateObserverObserveRows();
  const observerDisconnectRows = enumerateObserverDisconnectRows();
  const observerUnobserveRows = enumerateObserverUnobserveRows();
  const observerObserveReleaseRiskGaps = countObserverObserveReleaseRiskGaps(
    observerObserveRows,
    observerDisconnectRows,
    observerUnobserveRows
  );
  const timerDelayRows = enumerateTimerDelayRows();
  const immediateShortTimerRows = enumerateImmediateShortTimerContextRows(timerDelayRows);
  const immediateShortTimerAdmissionRows = enumerateImmediateShortTimerAdmissionRows(timerDelayRows);
  const immediateShortTimerNoWorkRows = enumerateImmediateShortTimerNoWorkRows(timerDelayRows);
  const immediateShortTimerSurfaceRows = enumerateImmediateShortTimerSurfaceRows(timerDelayRows);
  const timerCallbackRows = enumerateTimerCallbackRows();
  const timeoutScheduleRows = enumerateTimerScheduleRows('setTimeout');
  const timeoutClearRows = enumerateTimerClearRows('clearTimeout');
  const intervalScheduleRows = enumerateTimerScheduleRows('setInterval');
  const intervalClearRows = enumerateTimerClearRows('clearInterval');
  const timerScheduleClearRows = [...timeoutScheduleRows, ...intervalScheduleRows];
  const timerClearRows = [...timeoutClearRows, ...intervalClearRows];
  const timerScheduleClearRiskGaps = countTimerScheduleClearRiskGaps(
    timeoutScheduleRows,
    timeoutClearRows,
    intervalScheduleRows,
    intervalClearRows
  );
  const backgroundTimerOwnerRows = enumerateBackgroundTimerOwnerRows();
  const generatedVendorLifecycleFreshnessRows = enumerateGeneratedVendorLifecycleFreshnessRows();
  const websiteComponentLifecycleBoundaryRows = enumerateWebsiteComponentLifecycleBoundaryRows();
  const contentRuntimePageGlobalListenerRows = enumerateContentRuntimePageGlobalListenerRows();
  const explicitTeardownRows = enumerateExplicitTeardownRows();
  const animationFrameScheduleRows = enumerateAnimationFrameScheduleRows();
  const animationFrameCancelRows = enumerateAnimationFrameCancelRows();
  const animationFrameScheduleCancelRiskGaps = countAnimationFrameScheduleCancelRiskGaps(
    animationFrameScheduleRows,
    animationFrameCancelRows
  );
  const ids = new Set(rows.map(row => row.id));
  const doc = read(registerPath);

  assert.equal(rows.length, 527);
  assert.equal(ids.size, rows.length, 'file:line:family lifecycle instance ids must be unique');
  assert.deepEqual(countBy(rows, 'family'), {
    addEventListener: 294,
    cancelAnimationFrame: 4,
    clearInterval: 4,
    clearTimeout: 34,
    intersectionObserver: 4,
    mutationObserver: 16,
    removeEventListener: 13,
    requestAnimationFrame: 31,
    setInterval: 3,
    setTimeout: 124
  });

  assert.equal(addListenerOptionRows.length, 294);
  assert.deepEqual(countBy(addListenerOptionRows, 'optionKind'), {
    'boolean-false-bubble': 1,
    'boolean-true-capture': 23,
    'expression-or-identifier': 2,
    'no-third-argument': 238,
    'object-capture-true': 1,
    'object-once-true': 7,
    'object-passive-true': 16,
    'object-passive-true+capture-true': 6
  });
  assert.deepEqual(countAddEventOptionsBySourceFamily(addListenerOptionRows), {
    'content-runtime-js': {
      total: 74,
      'boolean-false-bubble': 1,
      'boolean-true-capture': 21,
      'no-third-argument': 24,
      'object-capture-true': 1,
      'object-once-true': 5,
      'object-passive-true': 16,
      'object-passive-true+capture-true': 6
    },
    'extension-ui-background-js': {
      total: 203,
      'boolean-true-capture': 2,
      'no-third-argument': 201
    },
    'generated-ui-output': {
      total: 2,
      'expression-or-identifier': 2
    },
    'vendor-bundles': {
      total: 8,
      'no-third-argument': 6,
      'object-once-true': 2
    },
    'website-components': {
      total: 7,
      'no-third-argument': 7
    }
  });

  assert.equal(addListenerEventRows.length, 294);
  assert.deepEqual(countBy(addListenerEventRows, 'eventKind'), {
    DOMContentLoaded: 8,
    blur: 1,
    change: 57,
    click: 116,
    close: 2,
    ended: 1,
    error: 2,
    filterTubeSeedReady: 1,
    focus: 2,
    focusin: 5,
    focusout: 4,
    hashchange: 1,
    input: 20,
    keydown: 14,
    keypress: 7,
    message: 6,
    mouseenter: 4,
    mouseleave: 5,
    'nonliteral-event': 4,
    open: 2,
    orientationchange: 1,
    pointerenter: 4,
    pointerleave: 3,
    pointermove: 1,
    pointerover: 1,
    popstate: 1,
    resize: 4,
    scroll: 6,
    storage: 1,
    toggle: 1,
    visibilitychange: 4,
    'yt-navigate-finish': 5
  });
  assert.deepEqual(countAddEventEventsBySourceFamily(addListenerEventRows), {
    'content-runtime-js': {
      total: 74,
      DOMContentLoaded: 6,
      change: 1,
      click: 16,
      ended: 1,
      filterTubeSeedReady: 1,
      focusin: 5,
      focusout: 4,
      input: 1,
      keydown: 4,
      message: 4,
      mouseenter: 4,
      mouseleave: 5,
      'nonliteral-event': 1,
      orientationchange: 1,
      pointerenter: 4,
      pointerleave: 3,
      pointermove: 1,
      pointerover: 1,
      resize: 1,
      scroll: 4,
      visibilitychange: 1,
      'yt-navigate-finish': 5
    },
    'extension-ui-background-js': {
      total: 203,
      DOMContentLoaded: 2,
      blur: 1,
      change: 54,
      click: 100,
      focus: 2,
      hashchange: 1,
      input: 19,
      keydown: 10,
      keypress: 7,
      popstate: 1,
      resize: 3,
      scroll: 2,
      toggle: 1
    },
    'generated-ui-output': {
      total: 2,
      'nonliteral-event': 2
    },
    'vendor-bundles': {
      total: 8,
      close: 2,
      error: 2,
      message: 2,
      open: 2
    },
    'website-components': {
      total: 7,
      change: 2,
      'nonliteral-event': 1,
      storage: 1,
      visibilitychange: 3
    }
  });

  assert.equal(addListenerTargetRows.length, 294);
  assert.deepEqual(countBy(addListenerTargetRows, 'targetKind'), {
    document: 41,
    'generated-shell-node': 2,
    'local-element-reference': 207,
    'optional-local-element-reference': 17,
    'vendor-transport-reference': 8,
    window: 19
  });
  assert.deepEqual(countAddEventTargetsBySourceFamily(addListenerTargetRows), {
    'content-runtime-js': {
      total: 74,
      document: 32,
      'local-element-reference': 32,
      window: 10
    },
    'extension-ui-background-js': {
      total: 203,
      document: 6,
      'local-element-reference': 173,
      'optional-local-element-reference': 17,
      window: 7
    },
    'generated-ui-output': {
      total: 2,
      'generated-shell-node': 2
    },
    'vendor-bundles': {
      total: 8,
      'vendor-transport-reference': 8
    },
    'website-components': {
      total: 7,
      document: 3,
      'local-element-reference': 2,
      window: 2
    }
  });

  assert.equal(addListenerEventTargetRows.length, 294);
  assert.deepEqual(countAddEventTargetEvents(addListenerEventTargetRows), {
    document: {
      total: 41,
      DOMContentLoaded: 7,
      click: 10,
      ended: 1,
      focusin: 2,
      focusout: 1,
      input: 1,
      keydown: 3,
      mouseleave: 1,
      'nonliteral-event': 1,
      pointerenter: 1,
      pointermove: 1,
      pointerover: 1,
      scroll: 2,
      visibilitychange: 4,
      'yt-navigate-finish': 5
    },
    'generated-shell-node': {
      total: 2,
      'nonliteral-event': 2
    },
    'local-element-reference': {
      total: 207,
      blur: 1,
      change: 42,
      click: 106,
      focus: 2,
      focusin: 3,
      focusout: 3,
      input: 17,
      keydown: 11,
      keypress: 7,
      mouseenter: 4,
      mouseleave: 4,
      pointerenter: 3,
      pointerleave: 3,
      toggle: 1
    },
    'optional-local-element-reference': {
      total: 17,
      change: 15,
      input: 2
    },
    'vendor-transport-reference': {
      total: 8,
      close: 2,
      error: 2,
      message: 2,
      open: 2
    },
    window: {
      total: 19,
      DOMContentLoaded: 1,
      filterTubeSeedReady: 1,
      hashchange: 1,
      message: 4,
      'nonliteral-event': 1,
      orientationchange: 1,
      popstate: 1,
      resize: 4,
      scroll: 4,
      storage: 1
    }
  });
  assert.deepEqual(countAddEventGlobalPairsBySourceFamily(addListenerEventTargetRows), {
    'content-runtime-js:document': {
      total: 32,
      DOMContentLoaded: 5,
      click: 7,
      ended: 1,
      focusin: 2,
      focusout: 1,
      input: 1,
      keydown: 2,
      mouseleave: 1,
      'nonliteral-event': 1,
      pointerenter: 1,
      pointermove: 1,
      pointerover: 1,
      scroll: 2,
      visibilitychange: 1,
      'yt-navigate-finish': 5
    },
    'content-runtime-js:window': {
      total: 10,
      DOMContentLoaded: 1,
      filterTubeSeedReady: 1,
      message: 4,
      orientationchange: 1,
      resize: 1,
      scroll: 2
    },
    'extension-ui-background-js:document': {
      total: 6,
      DOMContentLoaded: 2,
      click: 3,
      keydown: 1
    },
    'extension-ui-background-js:window': {
      total: 7,
      hashchange: 1,
      popstate: 1,
      resize: 3,
      scroll: 2
    },
    'website-components:document': {
      total: 3,
      visibilitychange: 3
    },
    'website-components:window': {
      total: 2,
      'nonliteral-event': 1,
      storage: 1
    }
  });
  assert.deepEqual(countHighRiskListenerEventTargetPairs(addListenerEventTargetRows), {
    documentClick: 10,
    documentDOMContentLoaded: 7,
    documentKeydown: 3,
    documentPointerOrMouse: 4,
    windowMessage: 4,
    windowRoute: 2,
    windowScrollResizeOrientation: 9,
    windowStorageVisibility: 1,
    localClick: 106,
    localChangeInputKeydown: 70,
    optionalLocalClick: 0,
    vendorTransportLifecycle: 8,
    generatedShellNonliteral: 2
  });
  assert.equal(contentRuntimePageGlobalListenerRows.length, 42);
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'targetKind'), {
    document: 32,
    window: 10
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'eventKind'), {
    DOMContentLoaded: 6,
    click: 7,
    ended: 1,
    filterTubeSeedReady: 1,
    focusin: 2,
    focusout: 1,
    input: 1,
    keydown: 2,
    message: 4,
    mouseleave: 1,
    'nonliteral-event': 1,
    orientationchange: 1,
    pointerenter: 1,
    pointermove: 1,
    pointerover: 1,
    resize: 1,
    scroll: 4,
    visibilitychange: 1,
    'yt-navigate-finish': 5
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'file'), {
    'js/content/block_channel.js': 16,
    'js/content/bridge_settings.js': 2,
    'js/content/collab_dialog.js': 3,
    'js/content/dom_fallback.js': 3,
    'js/content/first_run_prompt.js': 1,
    'js/content/release_notes_prompt.js': 1,
    'js/content_bridge.js': 14,
    'js/injector.js': 2
  });
  assert.deepEqual(countContentRuntimePageGlobalByDomain(contentRuntimePageGlobalListenerRows), {
    'collab-dialog-page-trigger-lifecycle': {
      total: 3,
      document: 3,
      window: 0
    },
    'content-bridge-dom-fallback-lifecycle': {
      total: 1,
      document: 1,
      window: 0
    },
    'content-bridge-fallback-menu-lifecycle': {
      total: 7,
      document: 6,
      window: 1
    },
    'content-bridge-main-world-message-lifecycle': {
      total: 1,
      document: 0,
      window: 1
    },
    'content-bridge-prefetch-whitelist-lifecycle': {
      total: 5,
      document: 5,
      window: 0
    },
    'dom-fallback-page-lifecycle': {
      total: 3,
      document: 2,
      window: 1
    },
    'injector-main-world-message-lifecycle': {
      total: 2,
      document: 0,
      window: 2
    },
    'kids-passive-menu-lifecycle': {
      total: 1,
      document: 1,
      window: 0
    },
    'native-menu-global-lifecycle': {
      total: 3,
      document: 3,
      window: 0
    },
    'prompt-page-boot-lifecycle': {
      total: 2,
      document: 2,
      window: 0
    },
    'quick-block-global-lifecycle': {
      total: 12,
      document: 9,
      window: 3
    },
    'settings-bridge-page-message-lifecycle': {
      total: 2,
      document: 0,
      window: 2
    }
  });
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.routeScope.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.surfaceScope.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.predicateClass.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.duplicateGuardClass.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.nativeMenuImpactClass.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.pageMessageTrustImpactClass.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.noWorkBudgetClass.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.positiveFixtureClass.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.negativeFixtureClass.startsWith('unclassified')).length, 0);
  assert.equal(contentRuntimePageGlobalListenerRows.filter(row => row.pageLifetimeJustificationClass.startsWith('unclassified')).length, 0);
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'routeScope'), {
    'extension-prompt-overlay-route': 2,
    'main-youtube-all-spa-routes': 12,
    'main-youtube-bridge-settings-message-route': 2,
    'main-youtube-collab-dialog-routes': 3,
    'main-youtube-content-bridge-message-route': 1,
    'main-youtube-dom-fallback-body-route': 1,
    'main-youtube-dom-fallback-scroll-route': 1,
    'main-youtube-fallback-menu-routes': 6,
    'main-youtube-injector-message-route': 2,
    'main-youtube-native-menu-routes': 3,
    'main-youtube-playlist-fallback-popover-route': 1,
    'main-youtube-prefetch-visibility-route': 1,
    'main-youtube-watch-playlist-guard-route': 2,
    'main-youtube-watch-playlist-panel-routes': 2,
    'main-youtube-whitelist-non-watch-spa-routes': 2,
    'youtube-kids-native-menu-routes': 1
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'surfaceScope'), {
    'bridge-settings-page-message-surface': 2,
    'collab-dialog-trigger-surface': 3,
    'content-bridge-page-message-surface': 1,
    'dom-fallback-body-observer-surface': 1,
    'dom-fallback-scroll-state-surface': 1,
    'fallback-menu-card-surface': 6,
    'identity-prefetch-visibility-surface': 1,
    'injector-page-message-surface': 2,
    'kids-native-menu-surface': 1,
    'native-dropdown-menu-surface': 3,
    'playlist-fallback-popover-surface': 1,
    'playlist-panel-prefetch-surface': 2,
    'prompt-overlay-boot-surface': 2,
    'quick-block-card-affordance-surface': 12,
    'watch-playlist-playback-guard-surface': 2,
    'whitelist-right-rail-surface': 2
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'predicateClass'), {
    'collab-runtime-enabled-gated': 3,
    'dom-fallback-playlist-guard-gated': 2,
    'dom-fallback-scroll-state-gated': 1,
    'fallback-lifecycle-work-gated': 1,
    'fallback-menu-eager-or-hover-gated': 6,
    'identity-prefetch-work-gated': 3,
    'kids-native-menu-listener-gated': 1,
    'main-world-message-source-gated': 4,
    'native-menu-listener-gated': 3,
    'playlist-popover-open-gated': 1,
    'prompt-needed-check-gated': 2,
    'quick-block-enabled-gated': 12,
    'seed-ready-pending-settings-gated': 1,
    'whitelist-mode-non-watch-gated': 2
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'duplicateGuardClass'), {
    'bridge-settings-seed-listener-flag': 1,
    'bridge-settings-window-message-flag': 1,
    'collab-domcontentloaded-boot': 1,
    'collab-listener-module-flag': 2,
    'content-bridge-script-load-singleton': 1,
    'dom-fallback-autoplay-guard-flag': 1,
    'dom-fallback-playlist-nav-guard-flag': 1,
    'dom-fallback-scroll-window-flag': 1,
    'fallback-menu-installed-flag': 6,
    'fallback-mutation-observer-active-flag': 1,
    'injector-script-load-singleton': 1,
    'injector-window-message-flag': 1,
    'kids-passive-script-load-singleton': 1,
    'native-menu-script-load-singleton': 3,
    'playlist-popover-replace-remove': 1,
    'playlist-prefetch-hook-flag': 2,
    'prefetch-observer-singleton': 1,
    'prompt-domcontentloaded-once': 2,
    'quick-block-module-flag': 12,
    'right-rail-whitelist-observer-flag': 2
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'nativeMenuImpactClass'), {
    'collaborator-dialog-trigger-impact': 3,
    'custom-fallback-menu-impact': 7,
    'dom-fallback-observer-impact': 1,
    'page-message-impact': 5,
    'playback-or-scroll-guard-impact': 3,
    'prefetch-or-whitelist-impact': 5,
    'prompt-overlay-impact': 2,
    'quick-block-affordance-impact': 12,
    'youtube-kids-native-menu-impact': 1,
    'youtube-native-menu-impact': 3
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'pageMessageTrustImpactClass'), {
    'bridge-settings-window-message-trust': 1,
    'content-bridge-main-world-message-trust': 1,
    'injector-runtime-lookup-message-trust': 1,
    'injector-subscription-import-message-trust': 1,
    'no-page-message-trust-impact': 37,
    'seed-ready-event-trust': 1
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'noWorkBudgetClass'), {
    'collab-runtime-no-work-budget': 3,
    'fallback-lifecycle-no-work-budget': 1,
    'fallback-menu-hover-eager-no-work-budget': 6,
    'identity-prefetch-no-work-budget': 3,
    'kids-native-menu-no-work-budget': 1,
    'native-menu-open-no-work-budget': 3,
    'page-message-no-work-budget': 4,
    'playback-guard-no-work-budget': 2,
    'playlist-popover-no-work-budget': 1,
    'prompt-needed-no-work-budget': 2,
    'quick-block-enabled-no-work-budget': 12,
    'scroll-state-no-work-budget': 1,
    'seed-ready-no-work-budget': 1,
    'whitelist-non-watch-no-work-budget': 2
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'positiveFixtureClass'), {
    'positive-fixture-card-affordance-refresh': 12,
    'positive-fixture-collab-trigger-dialog': 3,
    'positive-fixture-fallback-menu-scan': 6,
    'positive-fixture-kids-native-block-sync': 1,
    'positive-fixture-late-body-fallback-boot': 1,
    'positive-fixture-native-menu-open-close': 3,
    'positive-fixture-page-message-relay': 5,
    'positive-fixture-playlist-playback-guard': 2,
    'positive-fixture-playlist-popover-close': 1,
    'positive-fixture-prompt-needed-overlay': 2,
    'positive-fixture-scroll-state-refresh': 1,
    'positive-fixture-visible-card-prefetch': 3,
    'positive-fixture-whitelist-spa-refresh': 2
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'negativeFixtureClass'), {
    'negative-fixture-no-card-affordance-when-disabled': 12,
    'negative-fixture-no-collab-dialog-when-disabled': 3,
    'negative-fixture-no-fallback-menu-when-native-quiet': 6,
    'negative-fixture-no-fallback-observer-when-inactive': 1,
    'negative-fixture-no-kids-main-cross-talk': 1,
    'negative-fixture-no-native-menu-poison': 3,
    'negative-fixture-no-playback-guard-off-route': 3,
    'negative-fixture-no-prefetch-when-rules-inactive': 3,
    'negative-fixture-no-prompt-duplicate-overlay': 2,
    'negative-fixture-no-whitelist-watch-route-refresh': 2,
    'negative-fixture-popover-outside-click-only': 1,
    'negative-fixture-reject-untrusted-page-message': 5
  });
  assert.deepEqual(countBy(contentRuntimePageGlobalListenerRows, 'pageLifetimeJustificationClass'), {
    'module-singleton-page-lifetime': 30,
    'one-shot-boot-listener': 5,
    'page-world-message-singleton': 4,
    'seed-ready-singleton': 1,
    'transient-pointermove-remove': 1,
    'transient-popover-remove': 1
  });

  assert.equal(addListenerCallbackRows.length, 294);
  assert.deepEqual(countBy(addListenerCallbackRows, 'callbackKind'), {
    'identifier-callback-reference': 37,
    'inline-arrow-callback': 254,
    'member-callback-reference': 1,
    'other-callback-expression': 2
  });
  assert.deepEqual(countAddEventCallbacksBySourceFamily(addListenerCallbackRows), {
    'content-runtime-js': {
      total: 74,
      'identifier-callback-reference': 18,
      'inline-arrow-callback': 55,
      'member-callback-reference': 1
    },
    'extension-ui-background-js': {
      total: 203,
      'identifier-callback-reference': 12,
      'inline-arrow-callback': 191
    },
    'generated-ui-output': {
      total: 2,
      'other-callback-expression': 2
    },
    'vendor-bundles': {
      total: 8,
      'inline-arrow-callback': 8
    },
    'website-components': {
      total: 7,
      'identifier-callback-reference': 7
    }
  });

  assert.equal(listenerAddRows.length, 294);
  assert.equal(listenerRemoveRows.length, 13);
  assert.deepEqual(countBy(listenerRemoveRows, 'targetKind'), {
    document: 7,
    'generated-shell-node': 2,
    'local-element-reference': 2,
    window: 2
  });
  assert.deepEqual(countBy(listenerRemoveRows, 'eventKind'), {
    change: 2,
    click: 2,
    keydown: 1,
    'nonliteral-event': 3,
    pointermove: 1,
    storage: 1,
    visibilitychange: 3
  });
  assert.deepEqual(countBy(listenerRemoveRows, 'callbackKind'), {
    'identifier-callback-reference': 10,
    'member-callback-reference': 1,
    'other-callback-expression': 2
  });
  assert.deepEqual(countBy(listenerRemoveRows, 'optionKind'), {
    'boolean-true-capture': 3,
    'expression-or-identifier': 2,
    'no-third-argument': 7,
    'object-capture-true': 1
  });
  assert.deepEqual(countBy(listenerRemoveRows, 'captureKey'), {
    'capture-expression-or-identifier': 2,
    'capture-false': 7,
    'capture-true': 4
  });
  assert.deepEqual(countListenerAddRemoveBySourceFamily(listenerAddRows, listenerRemoveRows), {
    'content-runtime-js': {
      add: 74,
      remove: 4,
      delta: 70
    },
    'extension-ui-background-js': {
      add: 203,
      remove: 0,
      delta: 203
    },
    'generated-ui-output': {
      add: 2,
      remove: 2,
      delta: 0
    },
    'vendor-bundles': {
      add: 8,
      remove: 0,
      delta: 8
    },
    'website-components': {
      add: 7,
      remove: 7,
      delta: 0
    }
  });
  assert.deepEqual(listenerAddRemoveRiskGaps, {
    installMinusRemove: 281,
    captureEquivalentRemovePairs: 13,
    exactOptionShapeRemovePairs: 12,
    captureEquivalentOptionShapeMismatchPairs: 1,
    unmatchedRemoveRows: 0,
    pageGlobalListenerInstallsWithoutExplicitRemove: 51,
    inlineListenerInstallsWithoutRemoveHandle: 254
  });

  assert.equal(observerConstructorRows.length, 20);
  assert.deepEqual(countBy(observerConstructorRows, 'family'), {
    intersectionObserver: 4,
    mutationObserver: 16
  });
  assert.deepEqual(countObserverConstructorsBySourceFamily(observerConstructorRows), {
    'content-runtime-js': {
      total: 16,
      intersectionObserver: 2,
      mutationObserver: 14
    },
    'extension-ui-background-js': {
      total: 1,
      mutationObserver: 1
    },
    'website-components': {
      total: 3,
      intersectionObserver: 2,
      mutationObserver: 1
    }
  });
  assert.equal(observerConstructorCallbackRows.length, 20);
  assert.deepEqual(countBy(observerConstructorCallbackRows, 'callbackKind'), {
    'inline-arrow-callback': 20
  });
  assert.deepEqual(countBy(observerConstructorCallbackRows, 'callbackParameterKind'), {
    'entries-parameter-arrow': 2,
    'mutations-parameter-arrow': 9,
    'no-parameter-arrow': 7,
    'other-callback-parameter-shape': 2
  });
  assert.deepEqual(countObserverConstructorCallbacksBySourceFamily(observerConstructorCallbackRows), {
    'content-runtime-js': {
      total: 16,
      'inline-arrow-callback': 16
    },
    'extension-ui-background-js': {
      total: 1,
      'inline-arrow-callback': 1
    },
    'website-components': {
      total: 3,
      'inline-arrow-callback': 3
    }
  });

  assert.equal(observerObserveRows.length, 21);
  assert.deepEqual(countBy(observerObserveRows.map(row => ({
    observeFamily: classifyObserverObserveFamily(row)
  })), 'observeFamily'), {
    intersectionObserver: 2,
    mutationObserver: 19
  });
  assert.deepEqual(countObserverObserveFamiliesBySourceFamily(observerObserveRows), {
    'content-runtime-js': {
      total: 16,
      intersectionObserver: 2,
      mutationObserver: 14
    },
    'extension-ui-background-js': {
      total: 1,
      mutationObserver: 1
    },
    'website-components': {
      total: 4,
      mutationObserver: 4
    }
  });
  assert.deepEqual(countBy(observerObserveRows, 'targetKind'), {
    'card-or-row-element': 4,
    'document-body': 3,
    'dropdown-element': 4,
    'generic-target-element': 3,
    'other-observe-target': 4,
    'panel-or-rail-element': 2,
    'select-element': 1
  });
  assert.deepEqual(countBy(observerObserveRows, 'optionKind'), {
    'attributes-other': 1,
    'attributes-filter-aria-hidden': 1,
    'attributes-filter-collaborator-identity': 1,
    'attributes-filter-disabled': 1,
    'attributes-filter-style-hidden': 2,
    'child-list-only': 1,
    'child-list-subtree': 9,
    'no-options': 5
  });
  assert.deepEqual(countBy(observerObserveRows, 'receiverKind'), {
    'collab-dialog-observer': 1,
    'dropdown-close-observer': 2,
    'dropdown-discovery-observer': 1,
    'local-observer-variable': 11,
    'local-obs-variable': 2,
    'other-observer-observe-receiver': 3,
    'prefetch-observer': 1
  });
  assert.deepEqual(countObserverObserveTargetsBySourceFamily(observerObserveRows), {
    'content-runtime-js': {
      total: 16,
      'card-or-row-element': 4,
      'document-body': 3,
      'dropdown-element': 4,
      'generic-target-element': 3,
      'panel-or-rail-element': 2
    },
    'extension-ui-background-js': {
      total: 1,
      'select-element': 1
    },
    'website-components': {
      total: 4,
      'other-observe-target': 4
    }
  });
  assert.deepEqual(countObserverObserveOptionsBySourceFamily(observerObserveRows), {
    'content-runtime-js': {
      total: 16,
      'attributes-filter-aria-hidden': 1,
      'attributes-filter-collaborator-identity': 1,
      'attributes-filter-style-hidden': 2,
      'child-list-only': 1,
      'child-list-subtree': 9,
      'no-options': 2
    },
    'extension-ui-background-js': {
      total: 1,
      'attributes-filter-disabled': 1
    },
    'website-components': {
      total: 4,
      'attributes-other': 1,
      'no-options': 3
    }
  });
  assert.deepEqual(countObserverObserveReceiversBySourceFamily(observerObserveRows), {
    'content-runtime-js': {
      total: 16,
      'collab-dialog-observer': 1,
      'dropdown-close-observer': 2,
      'dropdown-discovery-observer': 1,
      'local-observer-variable': 10,
      'local-obs-variable': 1,
      'prefetch-observer': 1
    },
    'extension-ui-background-js': {
      total: 1,
      'local-obs-variable': 1
    },
    'website-components': {
      total: 4,
      'local-observer-variable': 1,
      'other-observer-observe-receiver': 3
    }
  });

  assert.equal(observerDisconnectRows.length, 14);
  assert.deepEqual(countBy(observerDisconnectRows, 'receiverKind'), {
    'collab-dialog-observer': 1,
    'dropdown-close-observer': 2,
    'dropdown-discovery-observer': 1,
    'local-observer-variable': 6,
    'other-observer-disconnect-receiver': 3,
    'popover-row-observer-state': 1
  });
  assert.deepEqual(countBy(observerDisconnectRows, 'file'), {
    'js/content/block_channel.js': 3,
    'js/content/collab_dialog.js': 1,
    'js/content_bridge.js': 6,
    'website/components/footer-signal-art.js': 3,
    'website/components/hero-video.js': 1
  });
  assert.deepEqual(countObserverDisconnectReceiversBySourceFamily(observerDisconnectRows), {
    'content-runtime-js': {
      total: 10,
      'collab-dialog-observer': 1,
      'dropdown-close-observer': 2,
      'dropdown-discovery-observer': 1,
      'local-observer-variable': 5,
      'popover-row-observer-state': 1
    },
    'website-components': {
      total: 4,
      'local-observer-variable': 1,
      'other-observer-disconnect-receiver': 3
    }
  });
  assert.equal(observerUnobserveRows.length, 1);
  assert.deepEqual(countBy(observerUnobserveRows, 'receiverKind'), {
    'quick-block-viewport-observer': 1
  });
  assert.deepEqual(countBy(observerUnobserveRows, 'file'), {
    'js/content/block_channel.js': 1
  });
  assert.deepEqual(observerObserveReleaseRiskGaps, {
    observeMinusRelease: 6,
    releaseRows: 15,
    disconnectReleaseRows: 14,
    unobserveReleaseRows: 1,
    localObserverObserveRows: 11,
    localObsObserveRows: 2,
    exactNamedObserveRows: 8,
    exactNamedObserveRowsWithRelease: 7,
    exactNamedObserveRowsWithoutRelease: 1,
    prefetchObserveRowsWithoutRelease: 1,
    contentRuntimeObserveReleaseDelta: 5,
    extensionUiObserveReleaseDelta: 1
  });

  assert.equal(timerDelayRows.length, 127);
  assert.deepEqual(countBy(timerDelayRows, 'family'), {
    setInterval: 3,
    setTimeout: 124
  });
  assert.deepEqual(countBy(timerDelayRows, 'delayKind'), {
    'math-max-expression': 5,
    'named-or-expression-delay': 38,
    'numeric-1-99-ms': 16,
    'numeric-100-199-ms': 18,
    'numeric-1000-4999-ms': 13,
    'numeric-200-999-ms': 17,
    'numeric-5000-plus-ms': 4,
    'numeric-zero': 16
  });
  assert.deepEqual(countTimerDelaysBySourceFamily(timerDelayRows), {
    'content-runtime-js': {
      total: 87,
      'math-max-expression': 5,
      'named-or-expression-delay': 22,
      'numeric-1-99-ms': 12,
      'numeric-100-199-ms': 14,
      'numeric-1000-4999-ms': 10,
      'numeric-200-999-ms': 10,
      'numeric-5000-plus-ms': 4,
      'numeric-zero': 10
    },
    'extension-ui-background-js': {
      total: 39,
      'named-or-expression-delay': 15,
      'numeric-1-99-ms': 4,
      'numeric-100-199-ms': 4,
      'numeric-1000-4999-ms': 3,
      'numeric-200-999-ms': 7,
      'numeric-zero': 6
    },
    'website-components': {
      total: 1,
      'named-or-expression-delay': 1
    }
  });

  assert.equal(timerCallbackRows.length, 127);
  assert.deepEqual(countBy(timerCallbackRows, 'family'), {
    setInterval: 3,
    setTimeout: 124
  });
  assert.deepEqual(countBy(timerCallbackRows, 'callbackKind'), {
    'identifier-callback-reference': 19,
    'inline-arrow-callback': 108
  });
  assert.deepEqual(countTimerCallbacksBySourceFamily(timerCallbackRows), {
    'content-runtime-js': {
      total: 87,
      'identifier-callback-reference': 13,
      'inline-arrow-callback': 74
    },
    'extension-ui-background-js': {
      total: 39,
      'identifier-callback-reference': 6,
      'inline-arrow-callback': 33
    },
    'website-components': {
      total: 1,
      'inline-arrow-callback': 1
    }
  });

  assert.equal(timeoutScheduleRows.length, 124);
  assert.equal(timeoutClearRows.length, 34);
  assert.equal(intervalScheduleRows.length, 3);
  assert.equal(intervalClearRows.length, 4);
  assert.deepEqual(countBy(timeoutScheduleRows, 'handleKind'), {
    'assigned-local-id-handle': 11,
    'assigned-named-state-handle': 24,
    'assigned-property-held-handle': 11,
    'fire-and-forget-schedule': 63,
    'promise-sleep-or-timeout': 14,
    'returned-timer-handle': 1
  });
  assert.deepEqual(countBy(intervalScheduleRows, 'handleKind'), {
    'assigned-named-state-handle': 3
  });
  assert.deepEqual(countTimerScheduleClearBySourceFamily(timerScheduleClearRows, timerClearRows), {
    'content-runtime-js': {
      schedules: 87,
      clears: 25,
      delta: 62
    },
    'extension-ui-background-js': {
      schedules: 39,
      clears: 11,
      delta: 28
    },
    'website-components': {
      schedules: 1,
      clears: 2,
      delta: -1
    }
  });
  assert.deepEqual(countTimerSchedulesByOwnerDomain(timerScheduleClearRows), {
    'background-authority-owner': { total: 10, setTimeout: 10, setInterval: 0 },
    'collaborator-dialog-owner': { total: 2, setTimeout: 2, setInterval: 0 },
    'content-bridge-owner': { total: 37, setTimeout: 36, setInterval: 1 },
    'content-helper-owner': { total: 12, setTimeout: 12, setInterval: 0 },
    'dashboard-ui-owner': { total: 15, setTimeout: 14, setInterval: 1 },
    'dom-fallback-owner': { total: 11, setTimeout: 11, setInterval: 0 },
    'extension-ui-background-owner': { total: 6, setTimeout: 6, setInterval: 0 },
    'injector-page-world-owner': { total: 6, setTimeout: 5, setInterval: 1 },
    'popup-ui-owner': { total: 2, setTimeout: 2, setInterval: 0 },
    'quick-and-menu-owner': { total: 16, setTimeout: 16, setInterval: 0 },
    'seed-network-owner': { total: 1, setTimeout: 1, setInterval: 0 },
    'state-import-owner': { total: 8, setTimeout: 8, setInterval: 0 },
    'website-client-owner': { total: 1, setTimeout: 1, setInterval: 0 }
  });
  assert.deepEqual(countTimerDelayBudgetsByOwnerDomain(timerDelayRows), {
    'background-authority-owner': {
      total: 10,
      'immediate-zero': 0,
      'short-under-200ms': 2,
      'medium-200-999ms': 1,
      'long-1000ms-plus': 0,
      'bounded-expression': 0,
      'named-or-expression': 7
    },
    'collaborator-dialog-owner': {
      total: 2,
      'immediate-zero': 0,
      'short-under-200ms': 0,
      'medium-200-999ms': 1,
      'long-1000ms-plus': 1,
      'bounded-expression': 0,
      'named-or-expression': 0
    },
    'content-bridge-owner': {
      total: 37,
      'immediate-zero': 3,
      'short-under-200ms': 10,
      'medium-200-999ms': 3,
      'long-1000ms-plus': 8,
      'bounded-expression': 2,
      'named-or-expression': 11
    },
    'content-helper-owner': {
      total: 12,
      'immediate-zero': 0,
      'short-under-200ms': 5,
      'medium-200-999ms': 2,
      'long-1000ms-plus': 0,
      'bounded-expression': 3,
      'named-or-expression': 2
    },
    'dashboard-ui-owner': {
      total: 15,
      'immediate-zero': 1,
      'short-under-200ms': 4,
      'medium-200-999ms': 5,
      'long-1000ms-plus': 3,
      'bounded-expression': 0,
      'named-or-expression': 2
    },
    'dom-fallback-owner': {
      total: 11,
      'immediate-zero': 3,
      'short-under-200ms': 3,
      'medium-200-999ms': 1,
      'long-1000ms-plus': 1,
      'bounded-expression': 0,
      'named-or-expression': 3
    },
    'extension-ui-background-owner': {
      total: 6,
      'immediate-zero': 1,
      'short-under-200ms': 2,
      'medium-200-999ms': 1,
      'long-1000ms-plus': 0,
      'bounded-expression': 0,
      'named-or-expression': 2
    },
    'injector-page-world-owner': {
      total: 6,
      'immediate-zero': 0,
      'short-under-200ms': 1,
      'medium-200-999ms': 2,
      'long-1000ms-plus': 1,
      'bounded-expression': 0,
      'named-or-expression': 2
    },
    'popup-ui-owner': {
      total: 2,
      'immediate-zero': 1,
      'short-under-200ms': 1,
      'medium-200-999ms': 0,
      'long-1000ms-plus': 0,
      'bounded-expression': 0,
      'named-or-expression': 0
    },
    'quick-and-menu-owner': {
      total: 16,
      'immediate-zero': 4,
      'short-under-200ms': 5,
      'medium-200-999ms': 0,
      'long-1000ms-plus': 3,
      'bounded-expression': 0,
      'named-or-expression': 4
    },
    'seed-network-owner': {
      total: 1,
      'immediate-zero': 0,
      'short-under-200ms': 0,
      'medium-200-999ms': 1,
      'long-1000ms-plus': 0,
      'bounded-expression': 0,
      'named-or-expression': 0
    },
    'state-import-owner': {
      total: 8,
      'immediate-zero': 3,
      'short-under-200ms': 1,
      'medium-200-999ms': 0,
      'long-1000ms-plus': 0,
      'bounded-expression': 0,
      'named-or-expression': 4
    },
    'website-client-owner': {
      total: 1,
      'immediate-zero': 0,
      'short-under-200ms': 0,
      'medium-200-999ms': 0,
      'long-1000ms-plus': 0,
      'bounded-expression': 0,
      'named-or-expression': 1
    }
  });
  assert.equal(immediateShortTimerRows.length, 50);
  assert.deepEqual(countBy(immediateShortTimerRows, 'owner'), {
    'background-authority-owner': 2,
    'content-bridge-owner': 13,
    'content-helper-owner': 5,
    'dashboard-ui-owner': 5,
    'dom-fallback-owner': 6,
    'extension-ui-background-owner': 3,
    'injector-page-world-owner': 1,
    'popup-ui-owner': 2,
    'quick-and-menu-owner': 9,
    'state-import-owner': 4
  });
  assert.deepEqual(countBy(immediateShortTimerRows, 'sideEffectClass'), {
    'background-map-flush': 2,
    'content-bridge-collaborator-rerun': 2,
    'content-bridge-fallback-menu-scan': 3,
    'content-bridge-native-menu-focus-release': 1,
    'content-bridge-playlist-fallback-press': 1,
    'content-bridge-single-channel-menu-close': 2,
    'content-bridge-stamp-fallback-rerun': 1,
    'content-bridge-startup-initialize': 1,
    'content-bridge-whitelist-refresh': 2,
    'content-helper-main-world-script-chain': 1,
    'content-helper-post-injection-settings-refresh': 1,
    'content-helper-prompt-dismiss-animation': 3,
    'dashboard-content-filter-listener-bind': 1,
    'dashboard-dialog-focus': 1,
    'dashboard-quick-action-focus': 3,
    'dom-fallback-cooperative-yield': 1,
    'dom-fallback-pending-rerun': 1,
    'dom-fallback-playlist-navigation': 4,
    'extension-ui-background-filter-logic-map-flush': 2,
    'extension-ui-background-render-engine-idle-polyfill': 1,
    'injector-engine-readiness-poll': 1,
    'popup-content-filter-listener-bind': 1,
    'popup-dialog-focus': 1,
    'quick-menu-kids-passive-body-readiness': 1,
    'quick-menu-native-dropdown-injection': 3,
    'quick-menu-native-menu-body-readiness': 1,
    'quick-menu-quick-block-fallback-rerun': 1,
    'quick-menu-quick-block-sweep': 1,
    'quick-menu-runtime-state-refresh': 2,
    'state-import-channel-enrichment': 2,
    'state-import-external-reload': 2
  });
  assert.equal(immediateShortTimerAdmissionRows.length, 50);
  assert.deepEqual(countBy(immediateShortTimerAdmissionRows, 'admissionFamily'), {
    'bootstrap-readiness': 9,
    'dom-rerun-or-scan': 11,
    'storage-cache-refresh': 8,
    'user-menu-or-navigation': 22
  });
  assert.deepEqual(countBy(immediateShortTimerAdmissionRows, 'admissionTriggerClass'), {
    'background-cache-write-debounce': 2,
    'block-action-menu-close': 2,
    'collaborator-resolution-dom-rerun': 2,
    'content-bridge-startup-bootstrap': 1,
    'content-prompt-dismiss-click': 3,
    'dashboard-quick-action-click-focus': 3,
    'dom-fallback-active-run-yield': 1,
    'dom-fallback-pending-coalesced-rerun': 1,
    'extension-ui-dialog-focus': 2,
    'extension-ui-listener-bootstrap': 2,
    'fallback-menu-row-click-feedback': 1,
    'fallback-menu-scan-trigger': 3,
    'identity-stamp-dom-rerun': 1,
    'idle-polyfill-fallback': 1,
    'kids-body-readiness-bootstrap': 1,
    'main-world-engine-readiness-poll': 1,
    'main-world-injection-chain': 1,
    'native-dropdown-injection-trigger': 3,
    'native-menu-body-readiness-bootstrap': 1,
    'native-menu-close-focus-release': 1,
    'page-world-map-message-debounce': 2,
    'post-injection-settings-refresh': 1,
    'quick-block-eager-sweep': 1,
    'quick-block-fallback-action-rerun': 1,
    'quick-block-global-input-refresh': 2,
    'storage-channel-enrichment': 2,
    'storage-external-reload': 2,
    'watch-playlist-navigation-action': 4,
    'whitelist-mode-non-watch-observer': 2
  });
  assert.equal(immediateShortTimerNoWorkRows.length, 50);
  assert.deepEqual(countBy(immediateShortTimerNoWorkRows, 'activePredicateClass'), {
    'bootstrap-readiness-gated': 9,
    'direct-user-action-gated': 20,
    'dom-fallback-run-inherited': 5,
    'eager-surface-gated': 4,
    'explicit-list-mode-route-gated': 2,
    'page-global-user-input-gated': 2,
    'storage-dirty-state-gated': 8
  });
  assert.equal(immediateShortTimerSurfaceRows.length, 50);
  assert.deepEqual(countBy(immediateShortTimerSurfaceRows, 'surfaceClass'), {
    'background-storage-runtime': 2,
    'content-prompt-overlay': 3,
    'extension-dashboard-ui': 5,
    'extension-popup-ui': 2,
    'extension-ui-render-engine': 1,
    'state-import-runtime': 4,
    'youtube-spa-content-runtime': 33
  });
  const youtubeSpaImmediateShortTimerRows = immediateShortTimerSurfaceRows
    .filter(row => row.surfaceClass === 'youtube-spa-content-runtime');
  assert.equal(youtubeSpaImmediateShortTimerRows.length, 33);
  assert.deepEqual(countBy(youtubeSpaImmediateShortTimerRows, 'activePredicateClass'), {
    'bootstrap-readiness-gated': 6,
    'direct-user-action-gated': 12,
    'dom-fallback-run-inherited': 5,
    'eager-surface-gated': 4,
    'explicit-list-mode-route-gated': 2,
    'page-global-user-input-gated': 2,
    'storage-dirty-state-gated': 2
  });
  assert.deepEqual(countBy(youtubeSpaImmediateShortTimerRows, 'admissionFamily'), {
    'bootstrap-readiness': 6,
    'dom-rerun-or-scan': 11,
    'storage-cache-refresh': 2,
    'user-menu-or-navigation': 14
  });
  const youtubeSpaEagerHotTimerRows = youtubeSpaImmediateShortTimerRows
    .filter(row => row.activePredicateClass === 'eager-surface-gated');
  assert.equal(youtubeSpaEagerHotTimerRows.length, 4);
  assert.deepEqual(countBy(youtubeSpaEagerHotTimerRows, 'sideEffectClass'), {
    'content-bridge-fallback-menu-scan': 3,
    'quick-menu-quick-block-sweep': 1
  });
  assert.deepEqual(countBy(youtubeSpaEagerHotTimerRows, 'admissionTriggerClass'), {
    'fallback-menu-scan-trigger': 3,
    'quick-block-eager-sweep': 1
  });
  assert.deepEqual(countBy(youtubeSpaEagerHotTimerRows, 'admissionFamily'), {
    'dom-rerun-or-scan': 4
  });
  const eagerContentBridgeSource = read('js/content_bridge.js');
  const eagerBlockChannelSource = read('js/content/block_channel.js');
  assert.match(eagerContentBridgeSource, /function shouldEagerFallbackMenuScan\(\) \{[\s\S]*host\.includes\('m\.youtube\.com'\)[\s\S]*window\.matchMedia\('\(hover: none\), \(pointer: coarse\)'\)\.matches/);
  assert.match(eagerContentBridgeSource, /function shouldInstallFallbackMenuButtons\(\) \{\s*return shouldEagerFallbackMenuScan\(\);/);
  assert.match(eagerBlockChannelSource, /const isMobileYouTubeSurface = \(\) => \{[\s\S]*host\.includes\('m\.youtube\.com'\)[\s\S]*window\.matchMedia\('\(hover: none\), \(pointer: coarse\)'\)\.matches/);
  assert.match(eagerBlockChannelSource, /function shouldEagerQuickBlockSweep\(\) \{\s*return isMobileYouTubeSurface\(\);/);
  assert.match(eagerBlockChannelSource, /function setupQuickBlockObserver\(\) \{[\s\S]*if \(!isQuickBlockEnabled\(\)\) return false;[\s\S]*if \(shouldEagerQuickBlockSweep\(\)\) \{[\s\S]*scheduleQuickBlockSweep\(document\);/);
  const youtubeSpaDesktopResidualHotTimerRows = youtubeSpaImmediateShortTimerRows
    .filter(row => row.activePredicateClass !== 'eager-surface-gated');
  assert.equal(youtubeSpaDesktopResidualHotTimerRows.length, 29);
  assert.deepEqual(countBy(youtubeSpaDesktopResidualHotTimerRows, 'activePredicateClass'), {
    'bootstrap-readiness-gated': 6,
    'direct-user-action-gated': 12,
    'dom-fallback-run-inherited': 5,
    'explicit-list-mode-route-gated': 2,
    'page-global-user-input-gated': 2,
    'storage-dirty-state-gated': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopResidualHotTimerRows, 'admissionFamily'), {
    'bootstrap-readiness': 6,
    'dom-rerun-or-scan': 7,
    'storage-cache-refresh': 2,
    'user-menu-or-navigation': 14
  });
  const youtubeSpaDesktopDirectUserActionHotTimerRows = youtubeSpaDesktopResidualHotTimerRows
    .filter(row => row.activePredicateClass === 'direct-user-action-gated');
  assert.equal(youtubeSpaDesktopDirectUserActionHotTimerRows.length, 12);
  assert.deepEqual(countBy(youtubeSpaDesktopDirectUserActionHotTimerRows, 'family'), {
    setTimeout: 12
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDirectUserActionHotTimerRows, 'sideEffectClass'), {
    'content-bridge-native-menu-focus-release': 1,
    'content-bridge-playlist-fallback-press': 1,
    'content-bridge-single-channel-menu-close': 2,
    'dom-fallback-playlist-navigation': 4,
    'quick-menu-native-dropdown-injection': 3,
    'quick-menu-quick-block-fallback-rerun': 1
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDirectUserActionHotTimerRows, 'admissionTriggerClass'), {
    'block-action-menu-close': 2,
    'fallback-menu-row-click-feedback': 1,
    'native-dropdown-injection-trigger': 3,
    'native-menu-close-focus-release': 1,
    'quick-block-fallback-action-rerun': 1,
    'watch-playlist-navigation-action': 4
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDirectUserActionHotTimerRows, 'file'), {
    'js/content/block_channel.js': 4,
    'js/content/dom_fallback.js': 4,
    'js/content_bridge.js': 4
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDirectUserActionHotTimerRows, 'owner'), {
    'content-bridge-owner': 4,
    'dom-fallback-owner': 4,
    'quick-and-menu-owner': 4
  });
  const directUserActionContentBridgeSource = read('js/content_bridge.js');
  const directUserActionBlockChannelSource = read('js/content/block_channel.js');
  const directUserActionDomFallbackSource = read('js/content/dom_fallback.js');
  assert.match(directUserActionContentBridgeSource, /setTimeout\(\(\) => \{[\s\S]*if \(hasVisibleMiniplayer\(\)\) return;[\s\S]*const ytdApp = document\.querySelector\('ytd-app'\);[\s\S]*ytdApp\.dispatchEvent\(clickEvent\);[\s\S]*\}, 50\);/);
  assert.match(directUserActionContentBridgeSource, /const pulsePressedState = async \(\) => \{[\s\S]*item\.classList\.add\('is-pressed'\);[\s\S]*await new Promise\(resolve => setTimeout\(resolve, 85\)\);[\s\S]*item\.classList\.remove\('is-pressed'\);/);
  assert.match(directUserActionContentBridgeSource, /setTimeout\(\(\) => \{[\s\S]*forceCloseDropdown\(dropdown\);[\s\S]*\}, 50\);/);
  assert.match(directUserActionContentBridgeSource, /setTimeout\(\(\) => \{[\s\S]*forceCloseDropdown\(successDropdown\);[\s\S]*\}, 90\);/);
  assert.match(directUserActionBlockChannelSource, /runQuickBlockFallback\(context, info, isKidsSite \? 'quickBlockKids' : 'quickBlock'\)[\s\S]*if \(fallbackResult\?\.success\) \{[\s\S]*setTimeout\(\(\) => applyDOMFallback\(null, \{ preserveScroll: true \}\), 120\);/);
  assert.match(directUserActionBlockChannelSource, /document\.addEventListener\('click', \(e\) => \{[\s\S]*const menuButton = target\.closest\([\s\S]*menuButtonSelector[\s\S]*lastClickedMenuButton = menuButton;[\s\S]*setTimeout\(\(\) => \{[\s\S]*tryInjectIntoVisibleDropdown\(\);[\s\S]*\}, 150\);/);
  assert.match(directUserActionBlockChannelSource, /if \(typeof requestAnimationFrame === 'function'\) \{[\s\S]*requestAnimationFrame\(\(\) => setTimeout\(run, 0\)\);[\s\S]*return;[\s\S]*setTimeout\(run, 0\);/);
  assert.match(directUserActionDomFallbackSource, /const targetLink = findNextAllowedWatchPlaylistLink\(settings, ownerMeta\.videoId\);[\s\S]*setTimeout\(\(\) => \{[\s\S]*targetLink\.click\(\);[\s\S]*\}, 60\);/);
  assert.match(directUserActionDomFallbackSource, /const nextButton = document\.querySelector\('\.ytp-next-button:not\(\[disabled\]\)'\);[\s\S]*setTimeout\(\(\) => \{[\s\S]*nextButton\.click\(\);[\s\S]*\}, 80\);/);
  assert.match(directUserActionDomFallbackSource, /Defer to avoid racing YouTube's internal end-of-video transition\.[\s\S]*setTimeout\(\(\) => \{[\s\S]*nextBtn\.click\(\);[\s\S]*\}, 0\);/);
  assert.match(directUserActionDomFallbackSource, /window\.__filtertubeLastPlaylistSkipTs = now;[\s\S]*setTimeout\(\(\) => \{[\s\S]*const nextBtn = document\.querySelector\('\.ytp-next-button:not\(\[disabled\]\)'\);[\s\S]*if \(nextBtn\) nextBtn\.click\(\);[\s\S]*\}, 80\);/);
  const youtubeSpaDesktopStartupReadinessHotTimerRows = youtubeSpaDesktopResidualHotTimerRows
    .filter(row => row.activePredicateClass === 'bootstrap-readiness-gated');
  assert.equal(youtubeSpaDesktopStartupReadinessHotTimerRows.length, 6);
  assert.deepEqual(countBy(youtubeSpaDesktopStartupReadinessHotTimerRows, 'family'), {
    setInterval: 1,
    setTimeout: 5
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStartupReadinessHotTimerRows, 'sideEffectClass'), {
    'content-bridge-startup-initialize': 1,
    'content-helper-main-world-script-chain': 1,
    'content-helper-post-injection-settings-refresh': 1,
    'injector-engine-readiness-poll': 1,
    'quick-menu-kids-passive-body-readiness': 1,
    'quick-menu-native-menu-body-readiness': 1
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStartupReadinessHotTimerRows, 'admissionTriggerClass'), {
    'content-bridge-startup-bootstrap': 1,
    'kids-body-readiness-bootstrap': 1,
    'main-world-engine-readiness-poll': 1,
    'main-world-injection-chain': 1,
    'native-menu-body-readiness-bootstrap': 1,
    'post-injection-settings-refresh': 1
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStartupReadinessHotTimerRows, 'file'), {
    'js/content/block_channel.js': 2,
    'js/content/bridge_injection.js': 2,
    'js/content_bridge.js': 1,
    'js/injector.js': 1
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStartupReadinessHotTimerRows, 'owner'), {
    'content-bridge-owner': 1,
    'content-helper-owner': 2,
    'injector-page-world-owner': 1,
    'quick-and-menu-owner': 2
  });
  const startupReadinessContentBridgeSource = read('js/content_bridge.js');
  const startupReadinessBlockChannelSource = read('js/content/block_channel.js');
  const startupReadinessBridgeInjectionSource = read('js/content/bridge_injection.js');
  const startupReadinessInjectorSource = read('js/injector.js');
  assert.match(startupReadinessContentBridgeSource, /setTimeout\(\(\) => initialize\(\), 50\);/);
  assert.match(startupReadinessBlockChannelSource, /if \(!document\.body\) \{\s*setTimeout\(startObserver, 100\);[\s\S]*blockChannelDebugLog\('FilterTube: Menu observer started'\);/);
  assert.match(startupReadinessBlockChannelSource, /if \(!document\.body\) return void setTimeout\(waitBody, 100\);[\s\S]*observer\.observe\(document\.body, \{ childList: true, subtree: true \}\);/);
  assert.match(startupReadinessBridgeInjectionSource, /script\.onload = \(\) => \{[\s\S]*setTimeout\(injectNext, 50\);/);
  assert.match(startupReadinessBridgeInjectionSource, /bridgeState\.scriptsInjected = true;[\s\S]*setTimeout\(\(\) => \{[\s\S]*requestSettingsFromBackground\(\);[\s\S]*\}, 100\);/);
  assert.match(startupReadinessInjectorSource, /const engineCheckInterval = setInterval\(\(\) => \{[\s\S]*window\.FilterTubeEngine\?\.processData[\s\S]*clearInterval\(engineCheckInterval\);[\s\S]*window\.postMessage\(\{[\s\S]*FilterTube_InjectorToBridge_Ready[\s\S]*\}, 100\);/);
  const youtubeSpaDesktopDomFallbackInheritedHotTimerRows = youtubeSpaDesktopResidualHotTimerRows
    .filter(row => row.activePredicateClass === 'dom-fallback-run-inherited');
  assert.equal(youtubeSpaDesktopDomFallbackInheritedHotTimerRows.length, 5);
  assert.deepEqual(countBy(youtubeSpaDesktopDomFallbackInheritedHotTimerRows, 'family'), {
    setTimeout: 5
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDomFallbackInheritedHotTimerRows, 'sideEffectClass'), {
    'content-bridge-collaborator-rerun': 2,
    'content-bridge-stamp-fallback-rerun': 1,
    'dom-fallback-cooperative-yield': 1,
    'dom-fallback-pending-rerun': 1
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDomFallbackInheritedHotTimerRows, 'admissionTriggerClass'), {
    'collaborator-resolution-dom-rerun': 2,
    'dom-fallback-active-run-yield': 1,
    'dom-fallback-pending-coalesced-rerun': 1,
    'identity-stamp-dom-rerun': 1
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDomFallbackInheritedHotTimerRows, 'file'), {
    'js/content/dom_fallback.js': 2,
    'js/content_bridge.js': 3
  });
  assert.deepEqual(countBy(youtubeSpaDesktopDomFallbackInheritedHotTimerRows, 'owner'), {
    'content-bridge-owner': 3,
    'dom-fallback-owner': 2
  });
  const domFallbackInheritedContentBridgeSource = read('js/content_bridge.js');
  const domFallbackInheritedDomFallbackSource = read('js/content/dom_fallback.js');
  const collaboratorRerunMatches = [...domFallbackInheritedContentBridgeSource.matchAll(
    /setTimeout\(\(\) => \{\s*try \{\s*applyDOMFallback\(null, \{ preserveScroll: true, forceReprocess: true \}\);/g
  )];
  assert.equal(collaboratorRerunMatches.length, 2);
  assert.match(domFallbackInheritedContentBridgeSource, /state\.timer = setTimeout\(\(\) => \{ state\.timer = 0; try \{ applyDOMFallback\(null\); \} catch \(e\) \{ \} \}, 120\);/);
  assert.match(domFallbackInheritedDomFallbackSource, /const yieldToMain = \(\) => new Promise\(resolve => setTimeout\(resolve, 0\)\);/);
  assert.match(domFallbackInheritedDomFallbackSource, /if \(runState\.pending\) \{[\s\S]*runState\.pending = false;[\s\S]*setTimeout\(\(\) => applyDOMFallback\(runState\.latestSettings, runState\.latestOptions\), 0\);/);
  const youtubeSpaDesktopStorageDirtyStateHotTimerRows = youtubeSpaDesktopResidualHotTimerRows
    .filter(row => row.activePredicateClass === 'storage-dirty-state-gated');
  assert.equal(youtubeSpaDesktopStorageDirtyStateHotTimerRows.length, 2);
  assert.deepEqual(countBy(youtubeSpaDesktopStorageDirtyStateHotTimerRows, 'family'), {
    setTimeout: 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStorageDirtyStateHotTimerRows, 'sideEffectClass'), {
    'extension-ui-background-filter-logic-map-flush': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStorageDirtyStateHotTimerRows, 'admissionTriggerClass'), {
    'page-world-map-message-debounce': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStorageDirtyStateHotTimerRows, 'file'), {
    'js/filter_logic.js': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopStorageDirtyStateHotTimerRows, 'owner'), {
    'extension-ui-background-owner': 2
  });
  const storageDirtyStateFilterLogicSource = read('js/filter_logic.js');
  const storageDirtyStateContentBridgeSource = read('js/content_bridge.js');
  assert.match(storageDirtyStateFilterLogicSource, /pendingVideoChannelFlush = setTimeout\(\(\) => \{[\s\S]*window\.postMessage\(\{[\s\S]*type: 'FilterTube_UpdateVideoChannelMap'[\s\S]*payload: batch[\s\S]*source: 'filter_logic'[\s\S]*\}, '\*'\);[\s\S]*\}, 50\);/);
  assert.match(storageDirtyStateFilterLogicSource, /pendingVideoMetaFlush = setTimeout\(\(\) => \{[\s\S]*window\.postMessage\(\{[\s\S]*type: 'FilterTube_UpdateVideoMetaMap'[\s\S]*payload: batch[\s\S]*source: 'filter_logic'[\s\S]*\}, '\*'\);[\s\S]*\}, 75\);/);
  assert.match(storageDirtyStateFilterLogicSource, /_registerVideoChannelMapping\(videoId, channelId\) \{[\s\S]*current\[videoId\] = channelId;[\s\S]*queueVideoChannelMapping\(videoId, channelId\);/);
  assert.match(storageDirtyStateFilterLogicSource, /_registerVideoMetaMapping\(videoId, meta\) \{[\s\S]*current\[videoId\] = \{[\s\S]*\.\.\.meta[\s\S]*queueVideoMetaMapping\(videoId, meta\);/);
  assert.match(storageDirtyStateContentBridgeSource, /type === 'FilterTube_UpdateVideoChannelMap'[\s\S]*persistVideoChannelMapping\(videoId, channelId\)[\s\S]*stampChannelIdentity\(card, \{ id: channelId \}, \{ scheduleFallback: false \}\)[\s\S]*applyDOMFallback\(null\);/);
  assert.match(storageDirtyStateContentBridgeSource, /type === 'FilterTube_UpdateVideoMetaMap'[\s\S]*persistVideoMetaMapping\(updates\)[\s\S]*touchDomForVideoMetaUpdate\(videoId\)[\s\S]*scheduleVideoMetaDomRerun\(\);/);
  const youtubeSpaDesktopExplicitListModeRouteHotTimerRows = youtubeSpaDesktopResidualHotTimerRows
    .filter(row => row.activePredicateClass === 'explicit-list-mode-route-gated');
  assert.equal(youtubeSpaDesktopExplicitListModeRouteHotTimerRows.length, 2);
  assert.deepEqual(countBy(youtubeSpaDesktopExplicitListModeRouteHotTimerRows, 'family'), {
    setTimeout: 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopExplicitListModeRouteHotTimerRows, 'sideEffectClass'), {
    'content-bridge-whitelist-refresh': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopExplicitListModeRouteHotTimerRows, 'admissionTriggerClass'), {
    'whitelist-mode-non-watch-observer': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopExplicitListModeRouteHotTimerRows, 'file'), {
    'js/content_bridge.js': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopExplicitListModeRouteHotTimerRows, 'owner'), {
    'content-bridge-owner': 2
  });
  const explicitListModeRouteContentBridgeSource = read('js/content_bridge.js');
  assert.match(explicitListModeRouteContentBridgeSource, /function installRightRailWhitelistObserver\(\) \{[\s\S]*if \(currentSettings\?\.listMode !== 'whitelist'\) return;[\s\S]*if \(rightRailWhitelistObserverInstalled\) return;/);
  assert.match(explicitListModeRouteContentBridgeSource, /const runWhitelistRefreshPass = \(\) => \{[\s\S]*if \(currentSettings\?\.listMode !== 'whitelist'\) return;[\s\S]*applyDOMFallback\(null, \{ preserveScroll: true, forceReprocess: true \}\);/);
  assert.match(explicitListModeRouteContentBridgeSource, /const scheduleWhitelistRefresh = \(\) => \{[\s\S]*if \(currentSettings\?\.listMode !== 'whitelist'\) return;[\s\S]*if \(typeof applyDOMFallback !== 'function'\) return;/);
  assert.match(explicitListModeRouteContentBridgeSource, /whitelistRefreshImmediateTimer = setTimeout\(\(\) => \{ whitelistRefreshImmediateTimer = 0; runWhitelistRefreshPass\(\); \}, 0\);/);
  assert.match(explicitListModeRouteContentBridgeSource, /whitelistRefreshFollowupTimer = setTimeout\(\(\) => \{ whitelistRefreshFollowupTimer = 0; runWhitelistRefreshPass\(\); \}, 120\);/);
  assert.match(explicitListModeRouteContentBridgeSource, /observer\.observe\(rail, \{ childList: true, subtree: true \}\);[\s\S]*document\.addEventListener\('yt-navigate-finish', \(\) => \{[\s\S]*scheduleWhitelistRefresh\(\);/);
  const youtubeSpaDesktopPageGlobalInputHotTimerRows = youtubeSpaDesktopResidualHotTimerRows
    .filter(row => row.activePredicateClass === 'page-global-user-input-gated');
  assert.equal(youtubeSpaDesktopPageGlobalInputHotTimerRows.length, 2);
  assert.deepEqual(countBy(youtubeSpaDesktopPageGlobalInputHotTimerRows, 'family'), {
    setTimeout: 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopPageGlobalInputHotTimerRows, 'sideEffectClass'), {
    'quick-menu-runtime-state-refresh': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopPageGlobalInputHotTimerRows, 'admissionTriggerClass'), {
    'quick-block-global-input-refresh': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopPageGlobalInputHotTimerRows, 'file'), {
    'js/content/block_channel.js': 2
  });
  assert.deepEqual(countBy(youtubeSpaDesktopPageGlobalInputHotTimerRows, 'owner'), {
    'quick-and-menu-owner': 2
  });
  const pageGlobalInputBlockChannelSource = read('js/content/block_channel.js');
  assert.match(pageGlobalInputBlockChannelSource, /function shouldRefreshQuickBlockRuntimeState\(\) \{[\s\S]*pruneQuickBlockViewportHosts\(\);[\s\S]*return shouldEagerQuickBlockSweep\(\) \|\| quickBlockViewportHosts\.size > 0;/);
  assert.match(pageGlobalInputBlockChannelSource, /function refreshQuickBlockRuntimeState\(options = \{\}\) \{[\s\S]*if \(!isQuickBlockEnabled\(\)\) return;[\s\S]*if \(!quickBlockObserverStarted\) \{[\s\S]*setupQuickBlockObserver\(\);[\s\S]*if \(!shouldRefreshQuickBlockRuntimeState\(\)\) return;[\s\S]*syncQuickBlockSurfaceState\(options\);[\s\S]*scheduleQuickBlockViewportRefresh\(\);/);
  assert.match(pageGlobalInputBlockChannelSource, /document\.addEventListener\('focusout', \(\) => \{[\s\S]*setTimeout\(\(\) => \{[\s\S]*refreshQuickBlockRuntimeState\(\{ force: true \}\);[\s\S]*\}, 0\);[\s\S]*\}, true\);/);
  assert.match(pageGlobalInputBlockChannelSource, /document\.addEventListener\('click', \(\) => \{[\s\S]*invalidateQuickBlockSurfaceStateCache\(\);[\s\S]*setTimeout\(\(\) => \{[\s\S]*refreshQuickBlockRuntimeState\(\{ force: true \}\);[\s\S]*\}, 0\);[\s\S]*\}, true\);/);
  const residualClassClosureRows = [
    ...youtubeSpaDesktopDirectUserActionHotTimerRows,
    ...youtubeSpaDesktopStartupReadinessHotTimerRows,
    ...youtubeSpaDesktopDomFallbackInheritedHotTimerRows,
    ...youtubeSpaDesktopStorageDirtyStateHotTimerRows,
    ...youtubeSpaDesktopPageGlobalInputHotTimerRows,
    ...youtubeSpaDesktopExplicitListModeRouteHotTimerRows
  ];
  assert.equal(residualClassClosureRows.length, youtubeSpaDesktopResidualHotTimerRows.length);
  assert.equal(new Set(residualClassClosureRows.map(row => row.id)).size, 29);
  assert.deepEqual(countBy(residualClassClosureRows, 'activePredicateClass'), {
    'bootstrap-readiness-gated': 6,
    'direct-user-action-gated': 12,
    'dom-fallback-run-inherited': 5,
    'explicit-list-mode-route-gated': 2,
    'page-global-user-input-gated': 2,
    'storage-dirty-state-gated': 2
  });
  assert.deepEqual(countBy(residualClassClosureRows, 'file'), {
    'js/content/block_channel.js': 8,
    'js/content/bridge_injection.js': 2,
    'js/content/dom_fallback.js': 6,
    'js/content_bridge.js': 10,
    'js/filter_logic.js': 2,
    'js/injector.js': 1
  });
  assert.deepEqual(countBy(residualClassClosureRows, 'owner'), {
    'content-bridge-owner': 10,
    'content-helper-owner': 2,
    'dom-fallback-owner': 6,
    'extension-ui-background-owner': 2,
    'injector-page-world-owner': 1,
    'quick-and-menu-owner': 8
  });
  assert.deepEqual(timerScheduleClearRiskGaps, {
    timeoutScheduleMinusClear: 90,
    intervalScheduleMinusClear: -1,
    timeoutClearRowsWithScheduleHandle: 32,
    timeoutClearRowsWithoutDirectScheduleHandle: 2,
    handledTimeoutScheduleRowsWithClearHandle: 26,
    handledTimeoutScheduleRowsWithoutClearHandle: 20,
    distinctScheduledTimeoutHandlesWithoutClear: 18,
    intervalClearRowsWithScheduleHandle: 4,
    intervalClearRowsWithoutDirectScheduleHandle: 0,
    handledIntervalScheduleRowsWithClearHandle: 3,
    handledIntervalScheduleRowsWithoutClearHandle: 0,
    distinctScheduledIntervalHandlesWithoutClear: 0
  });

  assert.equal(backgroundTimerOwnerRows.length, 14);
  assert.deepEqual(countBy(backgroundTimerOwnerRows, 'family'), {
    clearTimeout: 4,
    setTimeout: 10
  });
  assert.deepEqual(countBy(backgroundTimerOwnerRows, 'reason'), {
    'auto-backup-debounce-clear': 1,
    'auto-backup-debounce-schedule': 1,
    'backup-blob-url-revoke-delay': 1,
    'channel-map-flush-debounce': 1,
    'kids-watch-fetch-abort-clear': 1,
    'kids-watch-fetch-abort-schedule': 1,
    'post-block-enrichment-jitter': 1,
    'post-block-enrichment-wait-cap': 1,
    'shorts-fetch-abort-clear': 1,
    'shorts-fetch-abort-schedule': 1,
    'video-channel-map-flush-debounce': 1,
    'video-meta-map-flush-debounce': 1,
    'watch-fetch-abort-clear': 1,
    'watch-fetch-abort-schedule': 1
  });
  assert.deepEqual(countBackgroundTimersByDomain(backgroundTimerOwnerRows), {
    'backup-download-lifecycle': { total: 3, schedules: 2, clears: 1 },
    'identity-fetch-network-timeout': { total: 6, schedules: 3, clears: 3 },
    'identity-map-flush-lifecycle': { total: 3, schedules: 3, clears: 0 },
    'post-block-enrichment-lifecycle': { total: 2, schedules: 2, clears: 0 }
  });

  assert.equal(generatedVendorLifecycleFreshnessRows.length, 12);
  assert.deepEqual(countBy(generatedVendorLifecycleFreshnessRows, 'sourceFamily'), {
    'generated-ui-output': 4,
    'vendor-bundles': 8
  });
  assert.deepEqual(countBy(generatedVendorLifecycleFreshnessRows, 'family'), {
    addEventListener: 10,
    removeEventListener: 2
  });
  assert.deepEqual(countBy(generatedVendorLifecycleFreshnessRows, 'file'), {
    'js/ui-shell/popup-shell.js': 2,
    'js/ui-shell/tab-view-decor.js': 2,
    'js/vendor/nanah.bundle.js': 8
  });
  assert.deepEqual(countGeneratedVendorLifecycleByFreshnessClass(generatedVendorLifecycleFreshnessRows), {
    'generated-shell-output-lifecycle': { total: 4, addEventListener: 2, removeEventListener: 2 },
    'vendor-bundle-lifecycle': { total: 8, addEventListener: 8, removeEventListener: 0 }
  });
  for (const absentManifest of [
    'generated-artifacts.json',
    'release-artifacts/manifest.json',
    'js/ui-shell/generated-manifest.json'
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, absentManifest)), false, `${absentManifest} is not committed today`);
  }

  assert.equal(websiteComponentLifecycleBoundaryRows.length, 23);
  assert.deepEqual(countBy(websiteComponentLifecycleBoundaryRows, 'family'), {
    addEventListener: 7,
    cancelAnimationFrame: 1,
    clearTimeout: 2,
    intersectionObserver: 2,
    mutationObserver: 1,
    removeEventListener: 7,
    requestAnimationFrame: 2,
    setTimeout: 1
  });
  assert.deepEqual(countBy(websiteComponentLifecycleBoundaryRows, 'file'), {
    'website/components/footer-signal-art.js': 9,
    'website/components/hero-video.js': 5,
    'website/components/scene-controller.js': 5,
    'website/components/theme-toggle.js': 4
  });
  assert.deepEqual(countWebsiteComponentLifecycleByDomain(websiteComponentLifecycleBoundaryRows), {
    'website-other-lifecycle': {
      total: 14,
      installOrSchedule: 9,
      explicitTeardown: 5,
      addEventListener: 4,
      removeEventListener: 4,
      setTimeout: 0,
      clearTimeout: 0,
      requestAnimationFrame: 2,
      cancelAnimationFrame: 1,
      intersectionObserver: 2,
      mutationObserver: 1
    },
    'website-scene-scheduler-lifecycle': {
      total: 5,
      installOrSchedule: 2,
      explicitTeardown: 3,
      addEventListener: 1,
      cancelAnimationFrame: 0,
      intersectionObserver: 0,
      mutationObserver: 0,
      removeEventListener: 1,
      requestAnimationFrame: 0,
      setTimeout: 1,
      clearTimeout: 2
    },
    'website-theme-sync-lifecycle': {
      total: 4,
      installOrSchedule: 2,
      explicitTeardown: 2,
      addEventListener: 2,
      cancelAnimationFrame: 0,
      intersectionObserver: 0,
      mutationObserver: 0,
      removeEventListener: 2,
      requestAnimationFrame: 0,
      setTimeout: 0,
      clearTimeout: 0
    }
  });

  assert.equal(explicitTeardownRows.length, 55);
  assert.deepEqual(countBy(explicitTeardownRows, 'family'), {
    cancelAnimationFrame: 4,
    clearInterval: 4,
    clearTimeout: 34,
    removeEventListener: 13
  });
  assert.deepEqual(countBy(explicitTeardownRows, 'handleKind'), {
    'frame-other-handle': 1,
    'frame-position-handle': 1,
    'frame-profile-dropdown-handle': 2,
    'interval-dashboard-rotation-handle': 1,
    'interval-engine-check-handle': 2,
    'interval-warmup-handle': 1,
    'listener-document-target': 7,
    'listener-generated-shell-target': 2,
    'listener-other-target': 2,
    'listener-window-target': 2,
    'timeout-local-id-handle': 12,
    'timeout-named-state-handle': 14,
    'timeout-property-held-handle': 8
  });
  assert.deepEqual(countExplicitTeardownBySourceFamily(explicitTeardownRows), {
    'content-runtime-js': {
      total: 29,
      'interval-engine-check-handle': 2,
      'interval-warmup-handle': 1,
      'listener-document-target': 4,
      'timeout-local-id-handle': 5,
      'timeout-named-state-handle': 9,
      'timeout-property-held-handle': 8
    },
    'extension-ui-background-js': {
      total: 14,
      'frame-position-handle': 1,
      'frame-profile-dropdown-handle': 2,
      'interval-dashboard-rotation-handle': 1,
      'timeout-local-id-handle': 5,
      'timeout-named-state-handle': 5
    },
    'generated-ui-output': {
      total: 2,
      'listener-generated-shell-target': 2
    },
    'website-components': {
      total: 10,
      'frame-other-handle': 1,
      'listener-document-target': 3,
      'listener-other-target': 2,
      'listener-window-target': 2,
      'timeout-local-id-handle': 2
    }
  });

  assert.equal(animationFrameScheduleRows.length, 31);
  assert.deepEqual(countBy(animationFrameScheduleRows, 'frameScheduleKind'), {
    'assigned-positioning-frame-handle': 2,
    'identifier-callback-frame': 7,
    'inline-anonymous-frame': 15,
    'inline-scroll-into-view-frame': 5,
    'inline-timeout-hop-frame': 2
  });
  assert.deepEqual(countBy(animationFrameScheduleRows, 'file'), {
    'js/content/block_channel.js': 4,
    'js/content_bridge.js': 9,
    'js/popup.js': 1,
    'js/tab-view.js': 11,
    'js/ui_components.js': 4,
    'website/components/footer-signal-art.js': 2
  });
  assert.deepEqual(countBy(animationFrameScheduleRows.filter(row => row.handleSource), 'handleSource'), {
    positionRaf: 1,
    profileDropdownPositionRaf: 1
  });
  assert.deepEqual(countAnimationFrameSchedulesBySourceFamily(animationFrameScheduleRows), {
    'content-runtime-js': {
      total: 13,
      'identifier-callback-frame': 4,
      'inline-anonymous-frame': 7,
      'inline-timeout-hop-frame': 2
    },
    'extension-ui-background-js': {
      total: 16,
      'assigned-positioning-frame-handle': 2,
      'identifier-callback-frame': 1,
      'inline-anonymous-frame': 8,
      'inline-scroll-into-view-frame': 5
    },
    'website-components': {
      total: 2,
      'identifier-callback-frame': 2
    }
  });
  assert.equal(animationFrameCancelRows.length, 4);
  assert.deepEqual(countBy(animationFrameCancelRows, 'handleSource'), {
    frameId: 1,
    positionRaf: 1,
    profileDropdownPositionRaf: 2
  });
  assert.deepEqual(countAnimationFrameScheduleCancelBySourceFamily(
    animationFrameScheduleRows,
    animationFrameCancelRows
  ), {
    'content-runtime-js': {
      schedules: 13,
      cancels: 0,
      delta: 13,
      schedulesWithoutHandle: 13
    },
    'extension-ui-background-js': {
      schedules: 16,
      cancels: 3,
      delta: 13,
      schedulesWithoutHandle: 14
    },
    'website-components': {
      schedules: 2,
      cancels: 1,
      delta: 1,
      schedulesWithoutHandle: 2
    }
  });
  assert.deepEqual(animationFrameScheduleCancelRiskGaps, {
    frameScheduleMinusCancel: 27,
    frameSchedulesWithoutHandle: 29,
    frameSchedulesWithAssignedHandle: 2,
    frameCancelRowsWithScheduleHandle: 3,
    frameCancelRowsWithoutDirectScheduleHandle: 1,
    handledFrameScheduleRowsWithCancelHandle: 2,
    handledFrameScheduleRowsWithoutCancelHandle: 0,
    distinctScheduledFrameHandlesWithoutCancel: 0
  });

  for (const token of [
    'Event Listener Option Shape Addendum - 2026-05-28',
    'addEventListener option rows: 294',
    'no-third-argument listener installs: 238',
    'boolean true capture listener installs: 23',
    'object passive true listener installs: 16',
    'object passive true plus capture true listener installs: 6',
    'object once true listener installs: 7',
    'object capture true listener installs: 1',
    'boolean false bubble listener installs: 1',
    'expression or identifier listener option installs: 2',
    'listener option cleanup approval: NO-GO',
    'runtime behavior changed by this addendum: no',
    'ASCII listener option flow diagram: present',
    'Mermaid listener option flow diagram: present',
    'Event Listener Event-Type Addendum - 2026-05-28',
    'addEventListener event rows: 294',
    'click listener installs: 116',
    'change listener installs: 57',
    'input listener installs: 20',
    'keydown listener installs: 14',
    'DOMContentLoaded listener installs: 8',
    'ended listener installs: 1',
    'nonliteral event listener installs: 4',
    'missing event listener installs: 0',
    'listener event cleanup approval: NO-GO',
    'ASCII listener event flow diagram: present',
    'Mermaid listener event flow diagram: present',
    'Event Listener Target Addendum - 2026-05-28',
    'addEventListener target rows: 294',
    'local element listener targets: 207',
    'optional local element listener targets: 17',
    'document listener targets: 41',
    'window listener targets: 19',
    'vendor transport listener targets: 8',
    'generated shell listener targets: 2',
    'listener target cleanup approval: NO-GO',
    'ASCII listener target flow diagram: present',
    'Mermaid listener target flow diagram: present',
    'Event Listener Event-Target Matrix Addendum - 2026-05-28',
    'addEventListener event-target matrix rows: 294',
    'document click listener pairs: 10',
    'document DOMContentLoaded listener pairs: 7',
    'document keydown listener pairs: 3',
    'document pointer or mouse listener pairs: 4',
    'window message listener pairs: 4',
    'window route listener pairs: 2',
    'window scroll resize orientation listener pairs: 9',
    'window storage visibility listener pairs: 1',
    'local element click listener pairs: 106',
    'local element change input keydown listener pairs: 70',
    'optional local click listener pairs: 0',
    'vendor transport lifecycle listener pairs: 8',
    'generated shell nonliteral listener pairs: 2',
    'content runtime document listener pairs: 32',
    'content runtime window listener pairs: 10',
    'extension UI background document listener pairs: 6',
    'extension UI background window listener pairs: 7',
    'listener event-target cleanup approval: NO-GO',
    'ASCII listener event-target flow diagram: present',
    'Mermaid listener event-target flow diagram: present',
    'Event Listener Callback Identity Addendum - 2026-05-28',
    'addEventListener callback rows: 294',
    'inline arrow listener callbacks: 254',
    'identifier listener callbacks: 37',
    'member reference listener callbacks: 1',
    'other generated expression listener callbacks: 2',
    'missing listener callback arguments: 0',
    'content runtime listener callbacks: 74',
    'extension UI background listener callbacks: 203',
    'generated output listener callbacks: 2',
    'vendor bundle listener callbacks: 8',
    'website component listener callbacks: 7',
    'listener callback cleanup approval: NO-GO',
    'ASCII listener callback flow diagram: present',
    'Mermaid listener callback flow diagram: present',
    'Event Listener Add/Remove Parity Addendum - 2026-05-28',
    'addEventListener install rows for parity: 294',
    'removeEventListener teardown rows for parity: 13',
    'listener install-minus-remove delta: 281',
    'capture-equivalent listener remove pairs: 13',
    'exact option-shape listener remove pairs: 12',
    'capture-equivalent option-shape mismatch listener pairs: 1',
    'listener remove rows without capture-equivalent add pair: 0',
    'page-global listener installs without explicit remove: 51',
    'inline listener installs without remove handle: 254',
    'content runtime listener add/remove delta: 70',
    'extension UI background listener add/remove delta: 203',
    'generated UI output listener add/remove delta: 0',
    'vendor bundle listener add/remove delta: 8',
    'website component listener add/remove delta: 0',
    'document listener removes: 7',
    'local element listener removes: 2',
    'window listener removes: 2',
    'generated shell listener removes: 2',
    'listener add/remove cleanup approval: NO-GO',
    'ASCII listener add/remove parity flow diagram: present',
    'Mermaid listener add/remove parity flow diagram: present',
    'Content Runtime Page-Global Listener Boundary Addendum - 2026-05-28',
    'content runtime page-global listener rows: 42',
    'content runtime document listener rows: 32',
    'content runtime window listener rows: 10',
    'content runtime page-global source files: 8',
    'quick-block global listener rows: 12',
    'native menu global listener rows: 3',
    'kids passive menu listener rows: 1',
    'content bridge prefetch whitelist listener rows: 5',
    'content bridge fallback menu listener rows: 7',
    'content bridge main-world message listener rows: 1',
    'injector main-world message listener rows: 2',
    'page-global click listener rows: 7',
    'page-global DOMContentLoaded listener rows: 6',
    'page-global yt-navigate-finish listener rows: 5',
    'page-global message listener rows: 4',
    'page-global scroll listener rows: 4',
    'content runtime page-global listener cleanup approval: NO-GO',
    'ASCII content runtime page-global listener flow diagram: present',
    'Mermaid content runtime page-global listener flow diagram: present',
    'Content Runtime Page-Global Listener Row Context Addendum - 2026-05-28',
    'content runtime page-global row-context rows: 42',
    'content runtime page-global route scopes: 16',
    'content runtime page-global surface scopes: 16',
    'content runtime page-global predicate classes: 14',
    'content runtime page-global duplicate guard classes: 20',
    'page-global quick-block enabled-gated rows: 12',
    'page-global fallback menu eager-or-hover gated rows: 6',
    'page-global main-world message source-gated rows: 4',
    'page-global identity prefetch-work gated rows: 3',
    'page-global whitelist non-watch gated rows: 2',
    'content runtime page-global row-context cleanup approval: NO-GO',
    'ASCII content runtime page-global row-context flow diagram: present',
    'Mermaid content runtime page-global row-context flow diagram: present',
    'Content Runtime Page-Global Listener Impact And Fixture Addendum - 2026-05-28',
    'content runtime page-global impact rows: 42',
    'content runtime page-global native/menu impact classes: 10',
    'content runtime page-global page-message trust classes: 6',
    'content runtime page-global no-work budget classes: 14',
    'content runtime page-global positive fixture classes: 13',
    'content runtime page-global negative fixture classes: 12',
    'content runtime page-global page-lifetime classes: 6',
    'page-global quick-block affordance impact rows: 12',
    'page-global custom fallback menu impact rows: 7',
    'page-global page-message impact rows: 5',
    'page-global no page-message trust impact rows: 37',
    'page-global module singleton page-lifetime rows: 30',
    'content runtime page-global impact/fixture cleanup approval: NO-GO',
    'ASCII content runtime page-global impact fixture flow diagram: present',
    'Mermaid content runtime page-global impact fixture flow diagram: present',
    'Observer Observe Target Addendum - 2026-05-28',
    'observer observe rows: 21',
    'document body observe targets: 3',
    'dropdown observe targets: 4',
    'generic target observe targets: 3',
    'card or row observe targets: 4',
    'panel or rail observe targets: 2',
    'select observe targets: 1',
    'other observe targets: 4',
    'observer observe target cleanup approval: NO-GO',
    'ASCII observer observe target flow diagram: present',
    'Mermaid observer observe target flow diagram: present',
    'Observer Observe Option Shape Addendum - 2026-05-28',
    'observer observe option rows: 21',
    'observer observe childList subtree option rows: 9',
    'observer observe childList only option rows: 1',
    'observer observe no-options rows: 5',
    'observer observe attribute filter rows: 5',
    'observer observe style hidden attribute filter rows: 2',
    'observer observe aria-hidden attribute filter rows: 1',
    'observer observe disabled attribute filter rows: 1',
    'observer observe collaborator identity attribute filter rows: 1',
    'content runtime observer observe option rows: 16',
    'extension UI background observer observe option rows: 1',
    'website component observer observe option rows: 4',
    'observer observe option-shape cleanup approval: NO-GO',
    'ASCII observer observe option-shape flow diagram: present',
    'Mermaid observer observe option-shape flow diagram: present',
    'Observer Disconnect Addendum - 2026-05-28',
    'observer disconnect rows: 14',
    'local observer variable disconnect calls: 6',
    'dropdown close observer disconnect calls: 2',
    'dropdown discovery observer disconnect calls: 1',
    'collab dialog observer disconnect calls: 1',
    'popover row observer state disconnect calls: 1',
    'other observer disconnect receiver calls: 3',
    'observer disconnect cleanup approval: NO-GO',
    'ASCII observer disconnect flow diagram: present',
    'Mermaid observer disconnect flow diagram: present',
    'Observer Observe/Release Parity Addendum - 2026-05-28',
    'observer observe rows for release parity: 21',
    'observer release rows for parity: 15',
    'observer disconnect release rows: 14',
    'observer unobserve release rows: 1',
    'observer observe-minus-release delta: 6',
    'local observer variable observe rows: 11',
    'local obs variable observe rows: 2',
    'exact named observer observe rows: 8',
    'exact named observer observe rows with release: 7',
    'exact named observer observe rows without release: 1',
    'prefetch observer observe rows without release: 1',
    'content runtime observer observe/release delta: 5',
    'extension UI background observer observe/release delta: 1',
    'website component observer observe/release delta: 0',
    'observer observe/release cleanup approval: NO-GO',
    'ASCII observer observe/release parity flow diagram: present',
    'Mermaid observer observe/release parity flow diagram: present',
    'Observer Constructor/Observe Type Parity Addendum - 2026-05-28',
    'observer constructor rows for type parity: 20',
    'MutationObserver constructor rows for type parity: 16',
    'IntersectionObserver constructor rows for type parity: 4',
    'observer observe rows for type parity: 21',
    'mutation observer observe rows for type parity: 19',
    'intersection observer observe rows for type parity: 2',
    'observer constructor-minus-observe delta: -1',
    'mutation observer constructor-minus-observe delta: -3',
    'intersection observer constructor-minus-observe delta: 2',
    'content runtime observer constructor/observe delta: 0',
    'extension UI background observer constructor/observe delta: 0',
    'website component observer constructor/observe delta: -1',
    'observer constructor/observe type cleanup approval: NO-GO',
    'ASCII observer constructor/observe type parity flow diagram: present',
    'Mermaid observer constructor/observe type parity flow diagram: present',
    'Observer Constructor Callback Identity Addendum - 2026-05-28',
    'observer constructor callback rows: 20',
    'inline arrow observer constructor callbacks: 20',
    'identifier observer constructor callbacks: 0',
    'missing observer constructor callbacks: 0',
    'observer callbacks with mutations parameter: 9',
    'observer callbacks with entries parameter: 2',
    'observer callbacks with no parameter: 7',
    'content runtime observer constructor callbacks: 16',
    'extension UI background observer constructor callbacks: 1',
    'website component observer constructor callbacks: 3',
    'observer constructor callback cleanup approval: NO-GO',
    'ASCII observer constructor callback flow diagram: present',
    'Mermaid observer constructor callback flow diagram: present',
    'Timer Delay Shape Addendum - 2026-05-28',
    'timer delay rows: 127',
    'setTimeout delay rows: 124',
    'setInterval delay rows: 3',
    'numeric zero timer delays: 16',
    'numeric 1-99ms timer delays: 16',
    'numeric 100-199ms timer delays: 18',
    'numeric 200-999ms timer delays: 17',
    'numeric 1000-4999ms timer delays: 13',
    'numeric 5000ms plus timer delays: 4',
    'named or expression timer delays: 38',
    'math max expression timer delays: 5',
    'missing timer delay arguments: 0',
    'timer delay cleanup approval: NO-GO',
    'ASCII timer delay flow diagram: present',
    'Mermaid timer delay flow diagram: present',
    'Timer Callback Identity Addendum - 2026-05-28',
    'timer callback rows: 127',
    'setTimeout callback rows: 124',
    'setInterval callback rows: 3',
    'inline arrow timer callbacks: 108',
    'identifier timer callbacks: 19',
    'inline function timer callbacks: 0',
    'member reference timer callbacks: 0',
    'missing timer callback arguments: 0',
    'content runtime timer callbacks: 87',
    'extension UI background timer callbacks: 39',
    'website component timer callbacks: 1',
    'timer callback cleanup approval: NO-GO',
    'ASCII timer callback flow diagram: present',
    'Mermaid timer callback flow diagram: present',
    'Timer Schedule/Clear Parity Addendum - 2026-05-28',
    'setTimeout schedule rows for parity: 124',
    'clearTimeout rows for parity: 34',
    'setInterval schedule rows for parity: 3',
    'clearInterval rows for parity: 4',
    'setTimeout schedule-minus-clear delta: 90',
    'setInterval schedule-minus-clear delta: -1',
    'timeout schedules with assigned local id handle: 11',
    'timeout schedules with assigned named state handle: 24',
    'timeout schedules with assigned property-held handle: 11',
    'timeout fire-and-forget schedules: 63',
    'timeout promise sleep or timeout schedules: 14',
    'timeout returned handle schedules: 1',
    'interval schedules with assigned named state handle: 3',
    'clearTimeout rows with direct schedule handle: 32',
    'clearTimeout rows without direct schedule handle: 2',
    'handled timeout schedule rows with clear handle: 26',
    'handled timeout schedule rows without clear handle: 20',
    'distinct scheduled timeout handles without clear: 18',
    'clearInterval rows with direct schedule handle: 4',
    'clearInterval rows without direct schedule handle: 0',
    'handled interval schedule rows with clear handle: 3',
    'handled interval schedule rows without clear handle: 0',
    'distinct scheduled interval handles without clear: 0',
    'content runtime timer schedule/clear delta: 62',
    'extension UI background timer schedule/clear delta: 28',
    'website component timer schedule/clear delta: -1',
    'timer schedule/clear cleanup approval: NO-GO',
    'ASCII timer schedule/clear parity flow diagram: present',
    'Mermaid timer schedule/clear parity flow diagram: present',
    'Timer Owner Domain Context Addendum - 2026-05-30',
    'timer owner-context rows: 127',
    'timer owner domains: 13',
    'content-runtime timer owner-context rows: 87',
    'extension UI/background timer owner-context rows: 39',
    'website component timer owner-context rows: 1',
    'content bridge timer owner-context rows: 37',
    'quick/menu timer owner-context rows: 16',
    'dashboard timer owner-context rows: 15',
    'background timer owner-context rows: 10',
    'dom fallback timer owner-context rows: 11',
    'timer owner-context cleanup approval: NO-GO',
    'ASCII timer owner-domain flow diagram: present',
    'Mermaid timer owner-domain flow diagram: present',
    'Timer Owner Delay Budget Addendum - 2026-05-30',
    'timer owner delay-budget rows: 127',
    'timer owner immediate-zero budget rows: 16',
    'timer owner short-under-200ms budget rows: 34',
    'timer owner medium-200-999ms budget rows: 17',
    'timer owner long-1000ms-plus budget rows: 17',
    'timer owner bounded-expression budget rows: 5',
    'timer owner named-or-expression budget rows: 38',
    'content bridge immediate-or-short timer budget rows: 13',
    'quick/menu immediate-or-short timer budget rows: 9',
    'dom fallback immediate-or-short timer budget rows: 6',
    'dashboard immediate-or-short timer budget rows: 5',
    'timer owner delay-budget cleanup approval: NO-GO',
    'ASCII timer owner delay-budget flow diagram: present',
    'Mermaid timer owner delay-budget flow diagram: present',
    'Timer Immediate/Short Row Context Addendum - 2026-05-30',
    'timer immediate-short context rows: 50',
    'timer immediate-short owner domains: 10',
    'timer immediate-short side-effect classes: 31',
    'content bridge immediate-short context rows: 13',
    'quick/menu immediate-short context rows: 9',
    'dom fallback immediate-short context rows: 6',
    'native dropdown injection immediate-short timer rows: 3',
    'DOM fallback playlist navigation immediate-short timer rows: 4',
    'content bridge whitelist refresh immediate-short timer rows: 2',
    'timer immediate-short context cleanup approval: NO-GO',
    'ASCII immediate/short timer row-context flow diagram: present',
    'Mermaid immediate/short timer row-context flow diagram: present',
    'Timer Immediate/Short Admission Gate Addendum - 2026-05-30',
    'timer immediate-short admission rows: 50',
    'timer immediate-short admission families: 4',
    'timer immediate-short admission trigger classes: 29',
    'bootstrap/readiness immediate-short admission rows: 9',
    'DOM rerun/scan immediate-short admission rows: 11',
    'storage/cache immediate-short admission rows: 8',
    'user/menu/navigation immediate-short admission rows: 22',
    'whitelist non-watch observer immediate-short admission rows: 2',
    'native dropdown injection trigger immediate-short admission rows: 3',
    'watch playlist navigation immediate-short admission rows: 4',
    'timer immediate-short admission cleanup approval: NO-GO',
    'ASCII immediate/short timer admission flow diagram: present',
    'Mermaid immediate/short timer admission flow diagram: present',
    'Timer Immediate/Short No-Work Predicate Addendum - 2026-05-30',
    'timer immediate-short no-work predicate rows: 50',
    'timer immediate-short no-work predicate classes: 7',
    'direct user-action gated immediate-short timer rows: 20',
    'page-global user-input gated immediate-short timer rows: 2',
    'explicit list-mode route-gated immediate-short timer rows: 2',
    'eager surface-gated immediate-short timer rows: 4',
    'DOM fallback inherited immediate-short timer rows: 5',
    'bootstrap/readiness gated immediate-short timer rows: 9',
    'storage dirty-state gated immediate-short timer rows: 8',
    'timer immediate-short no-work predicate cleanup approval: NO-GO',
    'ASCII immediate/short timer no-work predicate flow diagram: present',
    'Mermaid immediate/short timer no-work predicate flow diagram: present',
    'Timer Immediate/Short Surface Ownership Addendum - 2026-05-30',
    'timer immediate-short surface rows: 50',
    'timer immediate-short surface classes: 7',
    'YouTube SPA content immediate-short timer rows: 33',
    'extension dashboard immediate-short timer rows: 5',
    'extension popup immediate-short timer rows: 2',
    'content prompt overlay immediate-short timer rows: 3',
    'background storage immediate-short timer rows: 2',
    'state/import immediate-short timer rows: 4',
    'extension UI render-engine immediate-short timer rows: 1',
    'timer immediate-short surface cleanup approval: NO-GO',
    'ASCII immediate/short timer surface ownership flow diagram: present',
    'Mermaid immediate/short timer surface ownership flow diagram: present',
    'YouTube SPA Immediate/Short Predicate Crosswalk Addendum - 2026-05-30',
    'YouTube SPA immediate-short predicate crosswalk rows: 33',
    'YouTube SPA immediate-short predicate crosswalk classes: 7',
    'YouTube SPA direct user-action gated hot timer rows: 12',
    'YouTube SPA bootstrap/readiness gated hot timer rows: 6',
    'YouTube SPA DOM fallback inherited hot timer rows: 5',
    'YouTube SPA eager surface-gated hot timer rows: 4',
    'YouTube SPA explicit list-mode route-gated hot timer rows: 2',
    'YouTube SPA page-global user-input gated hot timer rows: 2',
    'YouTube SPA storage dirty-state gated hot timer rows: 2',
    'YouTube SPA immediate-short predicate crosswalk cleanup approval: NO-GO',
    'ASCII YouTube SPA immediate/short predicate crosswalk flow diagram: present',
    'Mermaid YouTube SPA immediate/short predicate crosswalk flow diagram: present',
    'YouTube SPA Eager Hot Timer Candidate Addendum - 2026-05-30',
    'YouTube SPA eager hot timer rows: 4',
    'YouTube SPA eager hot timer classes: 2',
    'fallback menu eager hot timer rows: 3',
    'quick-block eager sweep hot timer rows: 1',
    'rule-list independent YouTube SPA eager hot timer rows: 4',
    'YouTube SPA eager hot timer cleanup approval: NO-GO',
    'ASCII YouTube SPA eager hot timer candidate flow diagram: present',
    'Mermaid YouTube SPA eager hot timer candidate flow diagram: present',
    'YouTube SPA Eager Hot Timer Route Admission Addendum - 2026-05-30',
    'YouTube SPA eager hot timer route admission rows: 4',
    'fallback menu mobile/coarse route-admitted hot timer rows: 3',
    'quick-block mobile/coarse route-admitted hot timer rows: 1',
    'source-admitted desktop hover/fine eager hot timer rows: 0',
    'shared eager surface classifier exists: no',
    'YouTube SPA eager hot timer route admission cleanup approval: NO-GO',
    'ASCII YouTube SPA eager hot timer route admission flow diagram: present',
    'Mermaid YouTube SPA eager hot timer route admission flow diagram: present',
    'YouTube SPA Desktop Hover/Fine Residual Hot Timer Addendum - 2026-05-30',
    'YouTube SPA desktop hover/fine residual hot timer rows: 29',
    'YouTube SPA desktop hover/fine residual predicate classes: 6',
    'desktop residual direct user-action gated hot timer rows: 12',
    'desktop residual bootstrap/readiness gated hot timer rows: 6',
    'desktop residual DOM fallback inherited hot timer rows: 5',
    'desktop residual explicit list-mode route-gated hot timer rows: 2',
    'desktop residual page-global user-input gated hot timer rows: 2',
    'desktop residual storage dirty-state gated hot timer rows: 2',
    'desktop residual eager-surface gated hot timer rows: 0',
    'YouTube SPA desktop hover/fine residual cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop residual hot timer flow diagram: present',
    'Mermaid YouTube SPA desktop residual hot timer flow diagram: present',
    'YouTube SPA Desktop Direct User-Action Hot Timer Addendum - 2026-05-30',
    'YouTube SPA desktop direct user-action hot timer rows: 12',
    'desktop direct user-action setTimeout rows: 12',
    'desktop direct user-action content_bridge rows: 4',
    'desktop direct user-action block_channel rows: 4',
    'desktop direct user-action dom_fallback rows: 4',
    'desktop direct user-action native dropdown injection rows: 3',
    'desktop direct user-action block-action menu close rows: 2',
    'desktop direct user-action watch playlist navigation rows: 4',
    'desktop direct user-action quick-block fallback rerun rows: 1',
    'desktop direct user-action fallback row feedback rows: 1',
    'desktop direct user-action native focus release rows: 1',
    'desktop direct user-action cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop direct user-action hot timer flow diagram: present',
    'Mermaid YouTube SPA desktop direct user-action hot timer flow diagram: present',
    'YouTube SPA Desktop Startup/Readiness Hot Timer Addendum - 2026-05-30',
    'YouTube SPA desktop startup/readiness hot timer rows: 6',
    'desktop startup/readiness setTimeout rows: 5',
    'desktop startup/readiness setInterval rows: 1',
    'desktop startup/readiness content bridge startup rows: 1',
    'desktop startup/readiness bridge injection rows: 2',
    'desktop startup/readiness quick/menu body readiness rows: 2',
    'desktop startup/readiness injector readiness poll rows: 1',
    'desktop startup/readiness cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop startup/readiness hot timer flow diagram: present',
    'Mermaid YouTube SPA desktop startup/readiness hot timer flow diagram: present',
    'YouTube SPA Desktop DOM-Fallback Inherited Hot Timer Addendum - 2026-05-30',
    'YouTube SPA desktop DOM-fallback inherited hot timer rows: 5',
    'desktop DOM-fallback inherited setTimeout rows: 5',
    'desktop DOM-fallback content-bridge rows: 3',
    'desktop DOM-fallback dom_fallback rows: 2',
    'desktop DOM-fallback collaborator rerun rows: 2',
    'desktop DOM-fallback identity stamp rerun rows: 1',
    'desktop DOM-fallback active yield rows: 1',
    'desktop DOM-fallback pending rerun rows: 1',
    'desktop DOM-fallback inherited cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop DOM-fallback inherited hot timer flow diagram: present',
    'Mermaid YouTube SPA desktop DOM-fallback inherited hot timer flow diagram: present',
    'YouTube SPA Desktop Storage Dirty-State Hot Timer Addendum - 2026-05-30',
    'YouTube SPA desktop storage dirty-state hot timer rows: 2',
    'desktop storage dirty-state setTimeout rows: 2',
    'desktop storage dirty-state filter_logic rows: 2',
    'desktop storage dirty-state videoChannelMap flush rows: 1',
    'desktop storage dirty-state videoMetaMap flush rows: 1',
    'desktop storage dirty-state bridge message consumers: 2',
    'desktop storage dirty-state cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop storage dirty-state hot timer flow diagram: present',
    'Mermaid YouTube SPA desktop storage dirty-state hot timer flow diagram: present',
    'YouTube SPA Desktop Page-Global Quick-Block Refresh Hot Timer Addendum - 2026-05-30',
    'YouTube SPA desktop page-global quick-block refresh hot timer rows: 2',
    'desktop page-global quick-block setTimeout rows: 2',
    'desktop page-global quick-block focusout refresh rows: 1',
    'desktop page-global quick-block click refresh rows: 1',
    'desktop page-global quick-block runtime refresh rows: 2',
    'desktop page-global quick-block cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop page-global quick-block refresh flow diagram: present',
    'Mermaid YouTube SPA desktop page-global quick-block refresh flow diagram: present',
    'YouTube SPA Desktop Explicit List-Mode Route Hot Timer Addendum - 2026-05-30',
    'YouTube SPA desktop explicit list-mode route hot timer rows: 2',
    'desktop explicit list-mode route setTimeout rows: 2',
    'desktop explicit list-mode route immediate refresh rows: 1',
    'desktop explicit list-mode route follow-up refresh rows: 1',
    'desktop explicit list-mode route content_bridge rows: 2',
    'desktop explicit list-mode route force reprocess rows: 2',
    'desktop explicit list-mode route cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop explicit list-mode route hot timer flow diagram: present',
    'Mermaid YouTube SPA desktop explicit list-mode route hot timer flow diagram: present',
    'YouTube SPA Desktop Residual Hot Timer Class-Closure Addendum - 2026-05-30',
    'YouTube SPA desktop residual class-closure hot timer rows: 29',
    'desktop residual class-closure predicate classes: 6',
    'desktop residual class-closure source files: 6',
    'desktop residual class-closure direct user-action rows: 12',
    'desktop residual class-closure startup/readiness rows: 6',
    'desktop residual class-closure DOM-fallback inherited rows: 5',
    'desktop residual class-closure storage dirty-state rows: 2',
    'desktop residual class-closure page-global quick-block rows: 2',
    'desktop residual class-closure explicit list-mode route rows: 2',
    'desktop residual class-closure content_bridge rows: 10',
    'desktop residual class-closure block_channel rows: 8',
    'desktop residual class-closure dom_fallback rows: 6',
    'desktop residual class-closure bridge_injection rows: 2',
    'desktop residual class-closure filter_logic rows: 2',
    'desktop residual class-closure injector rows: 1',
    'desktop residual class-closure cleanup approval: NO-GO',
    'ASCII YouTube SPA desktop residual hot timer class-closure flow diagram: present',
    'Mermaid YouTube SPA desktop residual hot timer class-closure flow diagram: present',
    'Background Timer Owner/Reason Addendum - 2026-05-28',
    'background timer lifecycle rows: 14',
    'background setTimeout schedule rows: 10',
    'background clearTimeout rows: 4',
    'backup/download background timer rows: 3',
    'post-block enrichment background timer rows: 2',
    'identity map flush background timer rows: 3',
    'identity fetch network timeout rows: 6',
    'auto-backup debounce schedule rows: 1',
    'auto-backup debounce clear rows: 1',
    'background blob URL revoke delay rows: 1',
    'post-block enrichment wait-cap rows: 1',
    'post-block enrichment jitter rows: 1',
    'channel map flush debounce rows: 1',
    'video channel map flush debounce rows: 1',
    'video meta map flush debounce rows: 1',
    'shorts fetch abort timeout schedule rows: 1',
    'kids watch fetch abort timeout schedule rows: 1',
    'watch fetch abort timeout schedule rows: 1',
    'fetch abort timeout clear rows: 3',
    'background timer explicit revision-token rows: 0',
    'background timer owner/reason cleanup approval: NO-GO',
    'ASCII background timer owner/reason flow diagram: present',
    'Mermaid background timer owner/reason flow diagram: present',
    'Generated/Vendor Lifecycle Freshness Addendum - 2026-05-28',
    'generated/vendor lifecycle rows: 12',
    'vendor bundle lifecycle rows: 8',
    'generated shell output lifecycle rows: 4',
    'vendor lifecycle addEventListener rows: 8',
    'vendor lifecycle removeEventListener rows: 0',
    'generated shell lifecycle addEventListener rows: 2',
    'generated shell lifecycle removeEventListener rows: 2',
    'generated shell lifecycle files: 2',
    'vendor lifecycle files: 1',
    'generated shell source files: 3',
    'generated shell output files: 2',
    'generated UI build script files: 1',
    'vendor bundle files: 2',
    'committed generated freshness manifest files: 0',
    'generated/vendor lifecycle freshness cleanup approval: NO-GO',
    'ASCII generated/vendor lifecycle freshness flow diagram: present',
    'Mermaid generated/vendor lifecycle freshness flow diagram: present',
    'Website Component Lifecycle Boundary Addendum - 2026-05-28',
    'website component lifecycle rows: 23',
    'website component install-or-schedule rows: 13',
    'website component explicit-teardown rows: 10',
    'website component addEventListener rows: 7',
    'website component removeEventListener rows: 7',
    'website component setTimeout rows: 1',
    'website component clearTimeout rows: 2',
    'website component lifecycle source files: 4',
    'website other lifecycle rows: 14',
    'website scene scheduler lifecycle rows: 5',
    'website theme sync lifecycle rows: 4',
    'website scene scheduler install-or-schedule rows: 2',
    'website scene scheduler explicit-teardown rows: 3',
    'website theme sync install-or-schedule rows: 2',
    'website theme sync explicit-teardown rows: 2',
    'website component lifecycle cleanup approval: NO-GO',
    'ASCII website component lifecycle boundary flow diagram: present',
    'Mermaid website component lifecycle boundary flow diagram: present',
    'Explicit Teardown Handle Addendum - 2026-05-28',
    'explicit teardown handle rows: 55',
    'removeEventListener teardown rows: 13',
    'clearTimeout teardown rows: 34',
    'clearInterval teardown rows: 4',
    'cancelAnimationFrame teardown rows: 4',
    'listener document teardown targets: 7',
    'listener window teardown targets: 2',
    'listener generated shell teardown targets: 2',
    'listener other teardown targets: 2',
    'timeout local id teardown handles: 12',
    'timeout named state teardown handles: 14',
    'timeout property held teardown handles: 8',
    'interval engine check teardown handles: 2',
    'interval warmup teardown handles: 1',
    'interval dashboard rotation teardown handles: 1',
    'frame profile dropdown teardown handles: 2',
    'frame position teardown handles: 1',
    'frame other teardown handles: 1',
    'explicit teardown cleanup approval: NO-GO',
    'ASCII explicit teardown flow diagram: present',
    'Mermaid explicit teardown flow diagram: present',
    'Animation Frame Schedule Addendum - 2026-05-28',
    'requestAnimationFrame schedule rows: 31',
    'assigned positioning frame handle schedules: 2',
    'inline anonymous frame schedules: 15',
    'identifier callback frame schedules: 7',
    'inline scrollIntoView frame schedules: 5',
    'inline timeout hop frame schedules: 2',
    'content runtime frame schedules: 13',
    'extension UI background frame schedules: 16',
    'website component frame schedules: 2',
    'positionRaf assigned frame schedules: 1',
    'profileDropdownPositionRaf assigned frame schedules: 1',
    'animation frame schedule cleanup approval: NO-GO',
    'ASCII animation frame schedule flow diagram: present',
    'Mermaid animation frame schedule flow diagram: present',
    'Animation Frame Schedule/Cancel Parity Addendum - 2026-05-28',
    'requestAnimationFrame schedule rows for parity: 31',
    'cancelAnimationFrame rows for parity: 4',
    'animation frame schedule-minus-cancel delta: 27',
    'frame schedules without assigned handle: 29',
    'frame schedules with assigned handle: 2',
    'cancelAnimationFrame rows with direct schedule handle: 3',
    'cancelAnimationFrame rows without direct schedule handle: 1',
    'handled frame schedule rows with cancel handle: 2',
    'handled frame schedule rows without cancel handle: 0',
    'distinct scheduled frame handles without cancel: 0',
    'content runtime frame schedule/cancel delta: 13',
    'extension UI background frame schedule/cancel delta: 13',
    'website component frame schedule/cancel delta: 1',
    'frameId cancel rows: 1',
    'positionRaf cancel rows: 1',
    'profileDropdownPositionRaf cancel rows: 2',
    'animation frame schedule/cancel cleanup approval: NO-GO',
    'ASCII animation frame schedule/cancel parity flow diagram: present',
    'Mermaid animation frame schedule/cancel parity flow diagram: present'
  ]) {
    assert.ok(doc.includes(token), `missing listener option addendum token ${token}`);
  }
});

test('every lifecycle instance has source family owner line and snippet metadata', () => {
  const rows = enumerateLifecycleInstances();

  for (const row of rows) {
    assert.ok(row.file, `missing file for ${row.id}`);
    assert.ok(Number.isInteger(row.line) && row.line > 0, `missing line for ${row.id}`);
    assert.ok(row.family, `missing family for ${row.id}`);
    assert.ok(row.sourceFamily, `missing source family for ${row.id}`);
    assert.ok(row.owner, `missing owner for ${row.id}`);
    assert.ok(row.snippet, `missing snippet for ${row.id}`);
  }
});

test('lifecycle instance source-family totals match the current register doc', () => {
  const rows = enumerateLifecycleInstances();
  const doc = read(registerPath);

  assert.deepEqual(countBy(rows, 'sourceFamily'), {
    'content-runtime-js': 219,
    'extension-ui-background-js': 273,
    'generated-ui-output': 4,
    'vendor-bundles': 8,
    'website-components': 23
  });

  for (const phrase of [
    '| `extension-ui-background-js` | 273 |',
    '| `content-runtime-js` | 219 |',
    '| `website-components` | 23 |',
    '| `vendor-bundles` | 8 |',
    '| `generated-ui-output` | 4 |',
    '| **Total lifecycle instances** | **527** |'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }
});

test('lifecycle instance hot files remain pinned before cleanup work', () => {
  const rows = enumerateLifecycleInstances();
  const byFile = countBy(rows, 'file');
  const doc = read(registerPath);
  const roleCounts = rows.reduce((acc, row) => {
    const role = lifecycleRole(row.family);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  assert.equal(byFile['js/tab-view.js'], 182);
  assert.equal(byFile['js/content_bridge.js'], 91);
  assert.equal(byFile['js/content/block_channel.js'], 71);
  assert.equal(byFile['js/popup.js'], 33);
  assert.equal(byFile['js/ui_components.js'], 26);
  assert.equal(byFile['js/background.js'], 14);
  assert.equal(byFile['js/content/dom_fallback.js'], 14);
  assert.equal(byFile['js/injector.js'], 12);
  assert.equal(byFile['js/content/bridge_settings.js'], 10);
  assert.equal(byFile['js/render_engine.js'], 9);

  assert.match(doc, /`js\/tab-view\.js` \| 182/);
  assert.match(doc, /`js\/content_bridge\.js` \| 91/);
  assert.match(doc, /`js\/content\/block_channel\.js` \| 71/);

  assert.deepEqual(roleCounts, {
    'explicit-teardown': 55,
    'install-or-schedule': 472
  });
  assert.deepEqual(countInstallTeardownBySourceFamily(rows), {
    'content-runtime-js': { install: 190, teardown: 29, total: 219 },
    'extension-ui-background-js': { install: 259, teardown: 14, total: 273 },
    'generated-ui-output': { install: 2, teardown: 2, total: 4 },
    'vendor-bundles': { install: 8, teardown: 0, total: 8 },
    'website-components': { install: 13, teardown: 10, total: 23 }
  });

  for (const phrase of [
    'Install/Teardown Imbalance Addendum - 2026-05-27',
    '| `install-or-schedule` | `addEventListener`, `MutationObserver`, `IntersectionObserver`, `setInterval`, `setTimeout`, `requestAnimationFrame` | 472 |',
    '| `explicit-teardown` | `removeEventListener`, `clearInterval`, `clearTimeout`, `cancelAnimationFrame` | 55 |',
    '| `extension-ui-background-js` | 259 | 14 | 273 |',
    '| `content-runtime-js` | 190 | 29 | 219 |',
    '| `vendor-bundles` | 8 | 0 | 8 |',
    '| `website-components` | 13 | 10 | 23 |',
    '| `generated-ui-output` | 2 | 2 | 4 |',
    'install-or-schedule lifecycle instances: 472',
    'explicit-teardown lifecycle instances: 55',
    'install-to-teardown ratio: 8.5:1',
    'shared lifecycle registry in product source: absent',
    'lifecycle cleanup approval from imbalance addendum: NO-GO',
    'runtime behavior changed by this addendum: no'
  ]) {
    assert.ok(doc.includes(phrase), `missing lifecycle imbalance phrase ${phrase}`);
  }
});

test('tracked source still has no shared lifecycle registry implementation', () => {
  const combined = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('docs/audit/') && !file.startsWith('tests/'))
    .map(read)
    .join('\n');

  assert.doesNotMatch(
    combined,
    /lifecycleRegistry|registerLifecycle|observerRegistry|timerRegistry|sideEffectRegistry|disposeAll|teardownAll/
  );
});

test('lifecycle instance register names future fixture gates before behavior changes', () => {
  const doc = read(registerPath);

  for (const fixtureName of [
    'lifecycle_instance_register_every_instance_has_owner_family',
    'lifecycle_instance_disabled_mode_zero_active_instances',
    'lifecycle_instance_empty_blocklist_zero_dom_scan_instances',
    'lifecycle_instance_quick_block_disabled_has_zero_page_lifecycle',
    'lifecycle_instance_fallback_menu_disabled_has_zero_page_lifecycle',
    'lifecycle_instance_whitelist_mode_suppresses_block_affordance_lifecycle',
    'lifecycle_instance_fullscreen_native_overlay_pauses_non_player_instances',
    'lifecycle_instance_route_change_tears_down_route_owned_instances',
    'lifecycle_instance_ui_listener_idempotence_dashboard_popup',
    'lifecycle_instance_background_timers_have_owner_and_revision_reason',
    'lifecycle_instance_vendor_generated_have_hash_and_freshness_proof',
    'lifecycle_instance_no_raw_capture_file_is_lifecycle_source'
  ]) {
    assert.ok(doc.includes(fixtureName), `missing fixture gate ${fixtureName}`);
  }
});

test('lifecycle instance register separates lexical counts from semantic lifecycle proof', () => {
  const doc = read(registerPath);

  assert.match(doc, /Lifecycle Instance Semantic Boundary/);
  assert.match(doc, /source-derived count/);
  assert.match(doc, /not semantic proof/);
  assert.match(doc, /file and exact owner function\/module/);
  assert.match(doc, /primitive type \(observer, listener, timeout, interval, frame, message, patch\)/);
  assert.match(doc, /install trigger and caller class/);
  assert.match(doc, /route\/surface scope/);
  assert.match(doc, /feature\/settings\/profile\/list-mode active predicate/);
  assert.match(doc, /disabled\/no-rule\/empty-list budget/);
  assert.match(doc, /pause\/resume behavior for native overlays, fullscreen, hidden tabs, and player transitions/);
  assert.match(doc, /teardown\/disconnect\/remove\/clear\/restore proof/);
  assert.match(doc, /DOM scan\/write, fetch, storage, message, stats, media\/player action/);
  assert.match(doc, /positive fixture and negative route-inactive\/no-rule fixture/);
});

test('lifecycle instance register links the source-derived content bridge lifecycle callback addendum', () => {
  const doc = read(registerPath);

  for (const token of [
    'Content Bridge Lifecycle Callback Addendum',
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/content-bridge-lifecycle-callback-semantic-register-current-behavior.test.mjs',
    '`js/content_bridge.js` 91-instance hot-file row',
    'source-derived callback/effect groups',
    '25 addEventListener',
    '36 setTimeout',
    '9 requestAnimationFrame',
    '13 semantic callback groups',
    'contentBridgeLifecycleCallbackAuthority',
    'contentBridgeLifecycleEffectReport',
    'contentBridgeCallbackOwnerContract',
    'contentBridgeNoRuleLifecycleBudget',
    'contentBridgeCallbackTeardownRegistry'
  ]) {
    assert.ok(doc.includes(token), `missing content bridge lifecycle callback addendum token ${token}`);
  }
});

test('lifecycle instance register links the source-derived DOM fallback lifecycle callback addendum', () => {
  const doc = read(registerPath);

  for (const token of [
    'DOM Fallback Lifecycle Callback Addendum',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/dom-fallback-lifecycle-callback-semantic-register-current-behavior.test.mjs',
    '`js/content/dom_fallback.js` 14-instance hot-file row',
    'source-derived callback/effect groups',
    '3 addEventListener',
    '11 setTimeout',
    '8 semantic callback',
    'current-watch owner retry/navigation timers',
    'page-lifetime scroll state',
    'playlist click/ended guards',
    'pending metadata and selected-row timers',
    'serialized pending reruns',
    'domFallbackLifecycleCallbackAuthority',
    'domFallbackLifecycleEffectReport',
    'domFallbackCallbackOwnerContract',
    'domFallbackNoRuleLifecycleBudget',
    'domFallbackCallbackTeardownRegistry',
    'domFallbackPlaylistGuardPolicy',
    'domFallbackPendingRunBudget',
    'domFallbackSyntheticNavigationBudget'
  ]) {
    assert.ok(doc.includes(token), `missing DOM fallback lifecycle callback addendum token ${token}`);
  }

  assertReleaseHotPathLifecycleRows();
});

function assertReleaseHotPathLifecycleRows() {
  const doc = read(registerPath);
  const rows = enumerateLifecycleInstances();
  const ids = new Set(rows.map(row => row.id));

  assert.match(doc, /Release Hot-Path Lifecycle Addendum - 2026-05-27/);
  assert.match(doc, /release hot-path lifecycle semantic rows: 17/);
  assert.match(doc, /shared lifecycle registry in product source: absent/);
  assert.match(doc, /runtime lifecycle cleanup approval from this addendum: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  for (const [rowId, file, needle, family, afterNeedle] of [
    ['release_lifecycle_storage_refresh_debounce', 'js/content/bridge_settings.js', 'pendingStorageRefreshTimer = setTimeout(() => {', 'setTimeout'],
    ['release_lifecycle_quick_hover_intent_timer', 'js/content/block_channel.js', 'quickBlockHoverIntentTimer = setTimeout(() => {', 'setTimeout'],
    ['release_lifecycle_quick_viewport_observer', 'js/content/block_channel.js', 'quickBlockHostVisibilityObserver = new IntersectionObserver((entries) => {', 'intersectionObserver'],
    ['release_lifecycle_quick_sweep_timer', 'js/content/block_channel.js', 'quickBlockSweepTimer = setTimeout(() => {', 'setTimeout'],
    ['release_lifecycle_quick_mutation_observer', 'js/content/block_channel.js', 'const observer = new MutationObserver((mutations) => {', 'mutationObserver', 'function setupQuickBlockObserver()'],
    ['release_lifecycle_menu_button_click_listener', 'js/content/block_channel.js', "document.addEventListener('click', (e) => {", 'addEventListener', 'const repairFilterTubeHiddenDropdownState = (dropdown) =>'],
    ['release_lifecycle_dropdown_visibility_observer', 'js/content/block_channel.js', 'const obs = new MutationObserver(() => {', 'mutationObserver'],
    ['release_lifecycle_menu_outside_pointer_listener', 'js/content/block_channel.js', 'document.addEventListener(', 'addEventListener', 'const closeFilterTubeInjectedDropdownsOnOutsidePointer = (event) =>'],
    ['release_lifecycle_dropdown_discovery_observer', 'js/content/block_channel.js', 'dropdownDiscoveryObserver = new MutationObserver((mutations) => {', 'mutationObserver'],
    ['release_lifecycle_dropdown_discovery_stop_timer', 'js/content/block_channel.js', 'dropdownDiscoveryStopTimer = setTimeout(stopDropdownDiscoveryObserver, 2500);', 'setTimeout'],
    ['release_lifecycle_whitelist_pending_recheck_timer', 'js/content_bridge.js', 'whitelistPendingRefreshState.timer = setTimeout(() => {', 'setTimeout'],
    ['release_lifecycle_whitelist_pending_hide_timer', 'js/content_bridge.js', 'whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {', 'setTimeout'],
    ['release_lifecycle_fallback_menu_mutation_observer', 'js/content_bridge.js', 'const observer = new MutationObserver((mutations) => {', 'mutationObserver', 'fallbackMenuButtonsRescan = () => {'],
    ['release_lifecycle_fallback_menu_warmup_interval', 'js/content_bridge.js', 'const warmupTimer = setInterval(() => {', 'setInterval']
  ]) {
    const line = afterNeedle ? lineOfAfter(file, afterNeedle, needle) : lineOf(file, needle);
    const docFamily = {
      intersectionObserver: 'IntersectionObserver',
      mutationObserver: 'MutationObserver'
    }[family] || family;
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing addendum row ${rowId}`);
    assert.ok(doc.includes(`\`${file}:${line}:${docFamily}\``), `missing current lifecycle instance for ${rowId}`);
    assert.ok(ids.has(`${file}:${line}:${family}`), `source enumeration missing ${file}:${line}:${family}`);
  }

  const blockChannel = read('js/content/block_channel.js');
  const quickGlobalStart = lineOf('js/content/block_channel.js', "document.addEventListener('focusin', () => {");
  const quickGlobalEnd = lineOf('js/content/block_channel.js', "document.addEventListener('pointerenter', (event) => {");
  assert.ok(doc.includes(`\`js/content/block_channel.js:${quickGlobalStart}-${quickGlobalEnd}:addEventListener\``));
  assert.match(blockChannel, /if \(!isQuickBlockEnabled\(\)\) return false;/);
  assert.match(blockChannel, /if \(!shouldRefreshQuickBlockRuntimeState\(\)\) return;/);
  assert.match(blockChannel, /if \(shouldEagerQuickBlockSweep\(\)\) \{/);
  assert.match(blockChannel, /dropdownDiscoveryStopTimer = setTimeout\(stopDropdownDiscoveryObserver, 2500\);/);
  assert.ok(blockChannel.includes("if (!dropdown.querySelector?.('.filtertube-block-channel-item')) return;"));

  const contentBridge = read('js/content_bridge.js');
  const fallbackListenerStart = lineOf('js/content_bridge.js', "document.addEventListener('pointerover', scheduleHoveredFallbackCard");
  const fallbackListenerEnd = lineOf('js/content_bridge.js', "document.addEventListener('click', (event) => {");
  assert.ok(doc.includes(`\`js/content_bridge.js:${fallbackListenerStart}-${fallbackListenerEnd}:addEventListener\``));
  assert.match(contentBridge, /if \(!shouldEagerFallbackMenuScan\(\)\) return;/);
  assert.match(contentBridge, /if \(shouldEagerFallbackMenuScan\(\)\) \{[\s\S]*const warmupTimer = setInterval/);
  assert.match(contentBridge, /if \(warmupScans >= 8\) \{[\s\S]*clearInterval\(warmupTimer\);/);
  assert.match(contentBridge, /if \(currentSettings\?\.listMode !== 'whitelist'\) return;/);
  assert.match(contentBridge, /if \(path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)\) return;/);

  const bridgeSettings = read('js/content/bridge_settings.js');
  assert.match(bridgeSettings, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;/);
  assert.match(bridgeSettings, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);

  const videoChannelFlushLine = lineOf('js/background.js', 'videoChannelMapFlushTimer = setTimeout(() => {');
  const videoMetaFlushLine = lineOf('js/background.js', 'videoMetaMapFlushTimer = setTimeout(() => {');
  assert.ok(doc.includes(`\`js/background.js:${videoChannelFlushLine},${videoMetaFlushLine}:setTimeout\``));
  for (const line of [videoChannelFlushLine, videoMetaFlushLine]) {
    assert.ok(ids.has(`js/background.js:${line}:setTimeout`), `missing background lifecycle id ${line}:setTimeout`);
  }

  assertModeSplitObserverBudgetAddendum();
}

function assertModeSplitObserverBudgetAddendum() {
  const doc = read(registerPath);
  const blockChannel = read('js/content/block_channel.js');
  const contentBridge = read('js/content_bridge.js');
  const collabDialog = read('js/content/collab_dialog.js');
  const seed = read('js/seed.js');

  assert.match(doc, /Mode-Split Observer Budget Addendum - 2026-05-27/);
  assert.match(doc, /complete observer\/listener\/timer authority/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /empty desktop observer budget proof: PARTIAL/);
  assert.match(doc, /active blocklist observer budget authority: NO-GO/);
  assert.match(doc, /mobile\/coarse observer budget authority: NO-GO/);
  assert.match(doc, /whitelist observer budget authority: NO-GO/);
  assert.match(doc, /watch\/YTM\/Kids observer budget authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  for (const row of [
    /\| Empty desktop blocklist \| `docs\/audit\/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26\.md:81-145` \|/,
    /\| Active desktop blocklist \| `js\/content\/block_channel\.js:353-365`, `js\/content\/block_channel\.js:1979-2028` \|/,
    /\| Mobile\/coarse YouTube \| `js\/content\/block_channel\.js:1291-1293`, `js\/content_bridge\.js:6525-6538`, `js\/content_bridge\.js:7146-7255` \|/,
    /\| Whitelist mode \| `js\/content_bridge\.js:1006-1015`, `js\/content_bridge\.js:1210-1270`, `js\/content_bridge\.js:1286-1301` \|/,
    /\| DOM fallback active work \| `js\/content_bridge\.js:6408-6505` \|/,
    /\| Collaborator dialog \| `js\/content\/collab_dialog\.js:29-31`, `js\/content\/collab_dialog\.js:370-378` \|/,
    /\| Seed JSON idle transport \| `js\/seed\.js:97-134`, `js\/seed\.js:684-698` \|/
  ]) {
    assert.match(doc, row);
  }

  assert.match(blockChannel, /function shouldRefreshQuickBlockRuntimeState\(\) \{\s*pruneQuickBlockViewportHosts\(\);\s*return shouldEagerQuickBlockSweep\(\) \|\| quickBlockViewportHosts\.size > 0;/);
  assert.match(blockChannel, /function shouldEagerQuickBlockSweep\(\) \{\s*return isMobileYouTubeSurface\(\);/);
  assert.match(blockChannel, /function setupQuickBlockObserver\(\) \{[\s\S]*document\.addEventListener\('pointerenter', \(event\) => \{/);
  assert.match(blockChannel, /dropdownDiscoveryStopTimer = setTimeout\(stopDropdownDiscoveryObserver, 2500\);/);

  assert.match(contentBridge, /function needsIdentityPrefetchWork\(settings\) \{[\s\S]*if \(settings\.listMode === 'whitelist'\) return true;[\s\S]*return bridgeHasList\(settings\.filterChannels\);/);
  assert.match(contentBridge, /function installRightRailWhitelistObserver\(\) \{\s*if \(currentSettings\?\.listMode !== 'whitelist'\) return;/);
  assert.match(contentBridge, /function hasActiveFallbackLifecycleWork\(\) \{[\s\S]*return hasActiveDOMFallbackWork\(currentSettings\);/);
  assert.match(contentBridge, /function shouldEagerFallbackMenuScan\(\) \{[\s\S]*return window\.matchMedia\('\(hover: none\), \(pointer: coarse\)'\)\.matches;/);
  assert.match(contentBridge, /const warmupTimer = setInterval\(\(\) => \{[\s\S]*if \(warmupScans >= 8\) \{[\s\S]*clearInterval\(warmupTimer\);/);

  assert.match(collabDialog, /function hasPendingCollabCards\(\) \{[\s\S]*window\.pendingCollabCards instanceof Map && window\.pendingCollabCards\.size > 0/);
  assert.match(collabDialog, /function refreshCollabDialogRuntime\(\) \{[\s\S]*ensureCollabTriggerListeners\(\);[\s\S]*ensureCollabDialogObserver\(\);[\s\S]*removeCollabTriggerListeners\(\);[\s\S]*disconnectCollabDialogObserver\(\);/);

  assert.match(seed, /let replayTimer = null;[\s\S]*function scheduleReplay\(\) \{[\s\S]*replayTimer = setTimeout\(\(\) => \{/);
  assert.match(seed, /if \(shouldBypassYouTubeiNetworkResponse\(dataName\)\) \{\s*return originalFetch\.apply\(this, arguments\);/);

  assertMobileCoarseObserverBudgetAddendum();
  assertWatchYtmKidsObserverBudgetAddendum();
}

function assertMobileCoarseObserverBudgetAddendum() {
  const doc = read(registerPath);
  const blockChannel = read('js/content/block_channel.js');
  const contentBridge = read('js/content_bridge.js');
  const quickSurface = blockChannel.slice(
    blockChannel.indexOf('const isMobileYouTubeSurface = () => {'),
    blockChannel.indexOf('const isHoverCapableDesktopSurface = () => {')
  );
  const quickStyles = blockChannel.slice(
    blockChannel.indexOf('function shouldEagerQuickBlockSweep() {'),
    blockChannel.indexOf('function removeQuickBlockButtons() {')
  );
  const quickButton = blockChannel.slice(
    blockChannel.indexOf('function ensureQuickBlockButton(card) {'),
    blockChannel.indexOf('// Keep host as the action identity root')
  );
  const quickObserver = blockChannel.slice(
    blockChannel.indexOf('function setupQuickBlockObserver() {'),
    blockChannel.indexOf('/**\n * Observe dropdowns and inject FilterTube menu items')
  );
  const fallbackAdmission = contentBridge.slice(
    contentBridge.indexOf('function shouldEagerFallbackMenuScan() {'),
    contentBridge.indexOf('function ensureFallbackMenuButtons() {')
  );
  const fallbackInstall = contentBridge.slice(
    contentBridge.indexOf('function ensureFallbackMenuButtons() {'),
    contentBridge.indexOf('const fallbackMenuCardSelector = [')
  );
  const fallbackVisibleScan = contentBridge.slice(
    contentBridge.indexOf('const scanVisible = () => {'),
    contentBridge.indexOf('const observer = new MutationObserver((mutations) => {')
  );
  const fallbackObserver = contentBridge.slice(
    contentBridge.indexOf('const observer = new MutationObserver((mutations) => {', contentBridge.indexOf('fallbackMenuButtonsRescan = () => {')),
    contentBridge.indexOf('}\n\nlet playlistFallbackPopoverState')
  );
  const quietGate = contentBridge.slice(
    contentBridge.indexOf('function isFilterTubeNativeOverlayQuietMode() {'),
    contentBridge.indexOf('if (isFilterTubeDebugEnabled()) {')
  );

  assert.match(doc, /Mobile\/Coarse Observer Budget Addendum - 2026-05-27/);
  assert.match(doc, /mobile\/coarse observer budget proof slices: 7/);
  assert.match(doc, /mobile\/coarse source proof: PARTIAL/);
  assert.match(doc, /mobile\/coarse live device trace authority: NO-GO/);
  assert.match(doc, /mobile fallback\/quick shared action gate authority: NO-GO/);
  assert.match(doc, /mobile\/coarse teardown authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /flowchart TD/);

  for (const row of [
    /\| Surface classifier \| `js\/content\/block_channel\.js:121-141`, `js\/content_bridge\.js:6525-6538` \|/,
    /\| Quick-block mobile style\/admission \| `js\/content\/block_channel\.js:1291-1300`, `js\/content\/block_channel\.js:1369-1403`, `js\/content\/block_channel\.js:1774-1800` \|/,
    /\| Quick-block mobile observer \| `js\/content\/block_channel\.js:1979-1989`, `js\/content\/block_channel\.js:2212-2275`, `js\/content\/block_channel\.js:2277-2289` \|/,
    /\| Fallback eager admission \| `js\/content_bridge\.js:6525-6538`, `js\/content_bridge\.js:6541-6550` \|/,
    /\| Fallback visible scan budget \| `js\/content_bridge\.js:6917-6946`, `js\/content_bridge\.js:7051-7084` \|/,
    /\| Fallback observer\/listener\/warmup budget \| `js\/content_bridge\.js:7146-7179`, `js\/content_bridge\.js:7190-7255` \|/,
    /\| Native overlay quiet gate \| `js\/content_bridge\.js:16-25`, `js\/content_bridge\.js:7051-7084`, `js\/content_bridge\.js:7146-7255` \|/
  ]) {
    assert.match(doc, row);
  }

  assert.match(quickSurface, /host\.includes\('m\.youtube\.com'\)/);
  assert.match(quickSurface, /window\.matchMedia\('\(hover: none\), \(pointer: coarse\)'\)\.matches/);
  assert.match(quickStyles, /function shouldEagerQuickBlockSweep\(\) \{\s*return isMobileYouTubeSurface\(\);/);
  assert.match(quickStyles, /document\.documentElement\.toggleAttribute\('data-filtertube-mobile-surface', mobileSurface\);/);
  assert.match(quickStyles, /html\[data-filtertube-mobile-surface\] \.filtertube-quick-block-wrap \{[\s\S]*opacity: 1;/);
  assert.match(quickStyles, /@media \(hover: none\) and \(pointer: coarse\) \{/);
  assert.match(quickButton, /const shouldForceVisible = isMobileYouTubeSurface\(\);/);
  assert.match(quickButton, /hostCard\.setAttribute\('data-filtertube-quick-force', 'true'\);/);
  assert.match(quickButton, /hostCard\.setAttribute\('data-filtertube-mobile-watch-next', 'true'\);/);
  assert.match(quickObserver, /if \(shouldEagerQuickBlockSweep\(\)\) \{[\s\S]*scheduleQuickBlockSweep\(document\);/);
  assert.match(quickObserver, /if \(shouldEagerQuickBlockSweep\(\)\) \{[\s\S]*const observer = new MutationObserver/);
  assert.match(quickObserver, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\);/);
  assert.match(quickObserver, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(quickObserver, /if \(shouldEagerQuickBlockSweep\(\)\) \{[\s\S]*scheduleQuickBlockSweep\(document\);/);

  assert.match(fallbackAdmission, /host\.includes\('m\.youtube\.com'\)/);
  assert.match(fallbackAdmission, /window\.matchMedia\('\(hover: none\), \(pointer: coarse\)'\)\.matches/);
  assert.match(fallbackAdmission, /function shouldInstallFallbackMenuButtons\(\) \{\s*return shouldEagerFallbackMenuScan\(\);/);
  assert.match(fallbackInstall, /if \(!shouldInstallFallbackMenuButtons\(\)\) \{\s*return;/);
  assert.match(fallbackInstall, /if \(shouldEagerFallbackMenuScan\(\) && typeof fallbackMenuButtonsRescan === 'function'\)/);
  assert.match(fallbackVisibleScan, /const nearViewport = rect\.bottom >= -margin/);
  assert.match(fallbackVisibleScan, /requestAnimationFrame\(runScan\);/);
  assert.match(fallbackVisibleScan, /setTimeout\(runScan, 160\);/);
  assert.match(fallbackObserver, /const observer = new MutationObserver\(\(mutations\) => \{/);
  assert.match(fallbackObserver, /if \(!shouldEagerFallbackMenuScan\(\)\) return;/);
  assert.match(fallbackObserver, /observer\.observe\(target, \{ childList: true, subtree: true \}\);/);
  assert.match(fallbackObserver, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallbackObserver, /window\.addEventListener\('scroll'/);
  assert.match(fallbackObserver, /const warmupTimer = setInterval\(\(\) => \{/);
  assert.match(fallbackObserver, /if \(warmupScans >= 8\) \{[\s\S]*clearInterval\(warmupTimer\);/);
  assert.match(quietGate, /window\.__filterTubeNativeOverlayCovered === true/);
  assert.match(quietGate, /data-filtertube-native-overlay-covered/);
  assert.match(quietGate, /window\.__filterTubeNativeFullscreenActive === true/);
  assert.match(quietGate, /data-filtertube-native-fullscreen/);
}

function assertWatchYtmKidsObserverBudgetAddendum() {
  const doc = read(registerPath);
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const ytmObserverDoc = read('docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_OBSERVER_TIMER_BUDGET_CURRENT_BEHAVIOR_2026-05-23.md');
  const kidsPassiveDoc = read('docs/audit/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md');

  const playlistPrefetchHook = contentBridge.slice(
    contentBridge.indexOf('function installPlaylistPanelPrefetchHook() {'),
    contentBridge.indexOf('function installRightRailWhitelistObserver() {')
  );
  const rightRailWhitelist = contentBridge.slice(
    contentBridge.indexOf('function installRightRailWhitelistObserver() {'),
    contentBridge.indexOf('function refreshFilterTubeRuntimeObservers() {')
  );
  const playlistGuards = domFallback.slice(
    domFallback.indexOf('if (!window.__filtertubePlaylistNavGuardInstalled) {'),
    domFallback.indexOf('try {\n        for (let elementIndex = 0;', domFallback.indexOf('if (!window.__filtertubePlaylistNavGuardInstalled) {'))
  );
  const quickSelectors = blockChannel.slice(
    blockChannel.indexOf('const QUICK_BLOCK_CARD_SELECTORS = ['),
    blockChannel.indexOf('const QUICK_BLOCK_CARD_CLASS_NAMES = [')
  );
  const quickSetup = blockChannel.slice(
    blockChannel.indexOf('function setupQuickBlockObserver() {'),
    blockChannel.indexOf('/**\n * Observe dropdowns and inject FilterTube menu items')
  );
  const fallbackMenuHost = contentBridge.slice(
    contentBridge.indexOf('const nativeMenuSelector = ['),
    contentBridge.indexOf('const createFallbackButton = (card, surface) => {')
  );
  const fallbackMenuLifecycle = contentBridge.slice(
    contentBridge.indexOf('const scanVisible = () => {'),
    contentBridge.indexOf('}\n\nlet playlistFallbackPopoverState')
  );
  const kidsMenuSetup = blockChannel.slice(
    blockChannel.indexOf('function setupMenuObserver() {'),
    blockChannel.indexOf('const menuButtonSelector = [')
  );
  const kidsPassive = blockChannel.slice(
    blockChannel.indexOf('function setupKidsPassiveBlockListener() {'),
    blockChannel.indexOf('function captureKidsMenuContext(menuButton) {')
  );
  const kidsHandler = blockChannel.slice(
    blockChannel.indexOf('async function handleKidsNativeBlock(blockType = \'video\', options = {}) {'),
    blockChannel.indexOf('/**\n * Try to inject into currently visible dropdown')
  );

  assert.match(doc, /Watch\/YTM\/Kids Observer Budget Addendum - 2026-05-27/);
  assert.match(doc, /watch\/YTM\/Kids observer budget proof slices: 7/);
  assert.match(doc, /watch\/YTM\/Kids source proof: PARTIAL/);
  assert.match(doc, /watch\/YTM\/Kids live trace authority: NO-GO/);
  assert.match(doc, /watch JSON\/DOM\/player\/menu owner authority: NO-GO/);
  assert.match(doc, /Kids passive mutation authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /flowchart TD/);

  for (const row of [
    /\| Watch playlist prefetch hook \| `js\/content_bridge\.js:1165-1208` \|/,
    /\| Whitelist right-rail observer \| `js\/content_bridge\.js:1210-1270` \|/,
    /\| DOM playlist click\/autoplay guards \| `js\/content\/dom_fallback\.js:2337-2440` \|/,
    /\| YTM\/watch\/Kids quick-block selectors \| `js\/content\/block_channel\.js:1089-1133`, `js\/content\/block_channel\.js:1979-2028` \|/,
    /\| YTM fallback menu host and scan lifecycle \| `js\/content_bridge\.js:6601-6609`, `js\/content_bridge\.js:6657-6716`, `js\/content_bridge\.js:6945-7149` \|/,
    /\| Kids passive menu listener \| `js\/content\/block_channel\.js:2318-2321`, `js\/content\/block_channel\.js:2595-2639`, `js\/content\/block_channel\.js:2764-2859` \|/,
    /\| Existing fixture\/document proof \| `docs\/audit\/FILTERTUBE_YTM_WATCH_PLAYER_OBSERVER_TIMER_BUDGET_CURRENT_BEHAVIOR_2026-05-23\.md:24-53`, `docs\/audit\/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md:102-121` \|/
  ]) {
    assert.match(doc, row);
  }

  assert.match(playlistPrefetchHook, /if \(!needsIdentityPrefetchWork\(currentSettings\)\) return;/);
  assert.match(playlistPrefetchHook, /document\.addEventListener\('scroll'/);
  assert.match(playlistPrefetchHook, /target\.closest\('ytd-playlist-panel-renderer'\)/);
  assert.match(playlistPrefetchHook, /const observer = new MutationObserver/);
  assert.match(playlistPrefetchHook, /observer\.observe\(panel, \{ childList: true, subtree: true \}\);/);
  assert.match(playlistPrefetchHook, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(rightRailWhitelist, /observer\.observe\(rail, \{ childList: true, subtree: true \}\);/);
  assert.match(playlistGuards, /window\.__filtertubePlaylistNavGuardInstalled = true;/);
  assert.match(playlistGuards, /document\.addEventListener\('click'/);
  assert.match(playlistGuards, /if \(currentSettings\?\.listMode === 'whitelist'\) return;/);
  assert.match(playlistGuards, /video\.pause\(\);/);
  assert.match(playlistGuards, /targetLink\.click\(\);/);
  assert.match(playlistGuards, /document\.addEventListener\('ended'/);
  assert.match(playlistGuards, /setTimeout\(\(\) => \{[\s\S]*nextBtn\.click\(\);/);
  assert.match(quickSelectors, /ytd-watch-card-compact-video-renderer/);
  assert.match(quickSelectors, /ytm-playlist-panel-video-renderer/);
  assert.match(quickSelectors, /ytm-universal-watch-card-renderer/);
  assert.match(quickSelectors, /ytk-compact-video-renderer/);
  assert.match(quickSetup, /document\.addEventListener\('focusin'/);
  assert.match(quickSetup, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallbackMenuHost, /ytm-menu-renderer button\[aria-label\]/);
  assert.match(fallbackMenuHost, /ytm-playlist-panel-video-renderer/);
  assert.match(fallbackMenuHost, /ytm-shorts-lockup-view-model/);
  assert.match(fallbackMenuLifecycle, /const nearViewport = rect\.bottom >= -margin/);
  assert.match(fallbackMenuLifecycle, /const observer = new MutationObserver/);
  assert.match(fallbackMenuLifecycle, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallbackMenuLifecycle, /const warmupTimer = setInterval/);
  assert.match(kidsMenuSetup, /if \(isKidsSite\) \{\s*setupKidsPassiveBlockListener\(\);\s*return;/);
  assert.match(kidsPassive, /document\.addEventListener\('click'/);
  assert.match(kidsPassive, /lastKidsMenuContext = captureKidsMenuContext\(menuButton\);/);
  assert.match(kidsPassive, /const observer = new MutationObserver/);
  assert.match(kidsPassive, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\);/);
  assert.match(kidsHandler, /if \(now - lastKidsBlockActionTs < 1000\)/);
  assert.match(kidsHandler, /handledKidsBlockActions\.add\(dedupKey\);/);
  assert.match(kidsHandler, /setTimeout\(\(\) => handledKidsBlockActions\.delete\(dedupKey\), 10000\);/);
  assert.match(kidsHandler, /action: 'FilterTube_KidsBlockChannel'/);
  assert.match(ytmObserverDoc, /YTM fallback menu scan/);
  assert.match(ytmObserverDoc, /Quick-block observer setup/);
  assert.match(kidsPassiveDoc, /YouTube Kids setup installs a capture-phase document click listener and a body MutationObserver/);
  assert.match(kidsPassiveDoc, /FilterTube_KidsBlockChannel/);

  assertHotYouTubeSpaLifecycleOwnerMatrixAddendum();
}

function assertHotYouTubeSpaLifecycleOwnerMatrixAddendum() {
  const doc = read(registerPath);
  const blockChannel = read('js/content/block_channel.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const bridgeSettings = read('js/content/bridge_settings.js');

  assert.match(doc, /Hot YouTube SPA Lifecycle Owner Matrix Addendum - 2026-05-29/);
  assert.match(doc, /hot YouTube SPA lifecycle owner rows: 16/);
  assert.match(doc, /hot lifecycle source-locus proof: PARTIAL/);
  assert.match(doc, /shared hot lifecycle registry authority: NO-GO/);
  assert.match(doc, /lifecycle cleanup\/pruning approval: NO-GO/);
  assert.match(doc, /route\/surface no-work budget authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /flowchart TD/);

  for (const rowId of [
    'hot_lifecycle_quick_block_setup_owner',
    'hot_lifecycle_quick_block_hover_pointer_owner',
    'hot_lifecycle_native_menu_setup_owner',
    'hot_lifecycle_dropdown_discovery_owner',
    'hot_lifecycle_dropdown_visibility_owner',
    'hot_lifecycle_identity_prefetch_owner',
    'hot_lifecycle_playlist_prefetch_hook_owner',
    'hot_lifecycle_whitelist_right_rail_owner',
    'hot_lifecycle_dom_fallback_observer_owner',
    'hot_lifecycle_fallback_menu_owner',
    'hot_lifecycle_video_meta_rerun_owner',
    'hot_lifecycle_dom_fallback_pending_rerun_owner',
    'hot_lifecycle_dom_pending_meta_owner',
    'hot_lifecycle_seed_replay_transport_owner',
    'hot_lifecycle_injector_startup_owner',
    'hot_lifecycle_bridge_settings_refresh_debounce_owner'
  ]) {
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing hot lifecycle owner row ${rowId}`);
  }

  for (const [file, needle] of [
    ['js/content/block_channel.js', 'function setupQuickBlockObserver() {'],
    ['js/content/block_channel.js', 'if (quickBlockHoverIntentTimer) {'],
    ['js/content/block_channel.js', 'document.addEventListener(\'pointermove\', onPointerMove, { passive: true, capture: true });'],
    ['js/content/block_channel.js', 'function setupMenuObserver() {'],
    ['js/content/block_channel.js', 'let dropdownDiscoveryObserver = null;'],
    ['js/content/block_channel.js', 'function ensureDropdownVisibilityObserver(dropdown) {'],
    ['js/content_bridge.js', 'function schedulePrefetchScan() {'],
    ['js/content_bridge.js', 'function installPlaylistPanelPrefetchHook() {'],
    ['js/content_bridge.js', 'function installRightRailWhitelistObserver() {'],
    ['js/content_bridge.js', 'function hasActiveFallbackLifecycleWork() {'],
    ['js/content_bridge.js', 'function shouldEagerFallbackMenuScan() {'],
    ['js/content_bridge.js', 'function scheduleVideoMetaDomRerun() {'],
    ['js/content/dom_fallback.js', 'async function applyDOMFallback(settings, options = {}) {'],
    ['js/content/dom_fallback.js', 'setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);'],
    ['js/content/dom_fallback.js', 'window.__filtertubePendingMetaRecheck'],
    ['js/seed.js', 'let replayTimer = null;'],
    ['js/injector.js', 'const engineCheckInterval = setInterval(() => {'],
    ['js/content/bridge_settings.js', 'pendingStorageRefreshTimer = setTimeout(() => {']
  ]) {
    const line = lineOf(file, needle);
    assert.ok(doc.includes(`\`${file}:${line}`), `missing current source pin for ${file}:${line}`);
  }

  assert.match(blockChannel, /function setupQuickBlockObserver\(\) \{/);
  assert.match(blockChannel, /document\.addEventListener\('pointerenter', \(event\) => \{/);
  assert.match(blockChannel, /document\.addEventListener\('pointermove', onPointerMove, \{ passive: true, capture: true \}\);/);
  assert.match(blockChannel, /function setupMenuObserver\(\) \{/);
  assert.match(blockChannel, /dropdownDiscoveryObserver = new MutationObserver\(\(mutations\) => \{/);
  assert.match(blockChannel, /dropdownDiscoveryStopTimer = setTimeout\(stopDropdownDiscoveryObserver, 2500\);/);
  assert.match(blockChannel, /function ensureDropdownVisibilityObserver\(dropdown\) \{/);

  assert.match(contentBridge, /function needsIdentityPrefetchWork\(settings\) \{/);
  assert.match(contentBridge, /function schedulePrefetchScan\(\) \{/);
  assert.match(contentBridge, /function startCardPrefetchObserver\(\) \{/);
  assert.match(contentBridge, /function installPlaylistPanelPrefetchHook\(\) \{/);
  assert.match(contentBridge, /function installRightRailWhitelistObserver\(\) \{/);
  assert.match(contentBridge, /function refreshDOMFallbackMutationObserver\(\) \{/);
  assert.match(contentBridge, /function shouldEagerFallbackMenuScan\(\) \{/);
  assert.match(contentBridge, /fallbackMenuButtonsRescan = \(\) => \{/);
  assert.match(contentBridge, /const warmupTimer = setInterval\(\(\) => \{/);
  assert.match(contentBridge, /function scheduleVideoMetaDomRerun\(\) \{/);

  assert.match(domFallback, /window\.__filtertubeDomFallbackRunState/);
  assert.match(domFallback, /setTimeout\(\(\) => applyDOMFallback\(runState\.latestSettings, runState\.latestOptions\), 0\);/);
  assert.match(domFallback, /window\.__filtertubePendingMetaRecheck/);

  assert.match(seed, /let replayTimer = null;/);
  assert.match(seed, /function scheduleReplay\(\) \{/);
  assert.match(seed, /replayTimer = setTimeout\(\(\) => \{/);

  assert.match(injector, /const engineCheckInterval = setInterval\(\(\) => \{/);
  assert.match(injector, /clearInterval\(engineCheckInterval\);/);

  assert.match(bridgeSettings, /pendingStorageRefreshTimer = setTimeout\(\(\) => \{/);
  assert.match(bridgeSettings, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;/);
}

function assertRuntimeLifecycleConvergenceBoundary() {
  const doc = read(registerPath);
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const productSource = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('docs/audit/'))
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');

  assert.match(doc, /Runtime Lifecycle Convergence Boundary - 2026-05-30/);
  assert.match(doc, /527 tracked lifecycle primitive instances/);
  assert.match(doc, /472 install-or-schedule rows/);
  assert.match(doc, /55 explicit teardown rows/);
  assert.match(doc, /missing shared lifecycle effect\/teardown authority/);
  assert.match(doc, /flowchart TD/);

  for (const rowId of [
    'lifecycle_convergence_primitive_census',
    'lifecycle_convergence_listener_surface',
    'lifecycle_convergence_observer_surface',
    'lifecycle_convergence_timer_frame_surface',
    'lifecycle_convergence_hot_spa_owners',
    'lifecycle_convergence_mode_surface_budget',
    'lifecycle_convergence_teardown_effect_budget',
    'lifecycle_convergence_menu_overlay_timing',
    'lifecycle_convergence_method_json_dependency',
    'lifecycle_convergence_authority_absence'
  ]) {
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing lifecycle convergence row ${rowId}`);
  }

  for (const phrase of [
    /runtime lifecycle convergence rows: 10/,
    /implementation-ready runtime lifecycle convergence rows: 0/,
    /tracked lifecycle primitive instances: 527/,
    /install-or-schedule lifecycle rows: 472/,
    /explicit teardown lifecycle rows: 55/,
    /hot YouTube SPA lifecycle owner rows: 16/,
    /YouTube SPA immediate\/short hot timer rows: 33/,
    /files with complete per-callable semantic proof: 0/,
    /runtime lifecycle cleanup approval: NO-GO/,
    /runtime behavior changed by this addendum: no/
  ]) {
    assert.match(doc, phrase);
  }

  for (const token of [
    'lifecycleEffectBudget',
    'lifecycleOwnerDecision',
    'routeSurfaceLifecycleScope',
    'fullscreenPauseAuthority',
    'nativeOverlayPauseAuthority',
    'noRuleLifecycleCounter',
    'lifecycleTeardownAuthority',
    'listenerLifecycleAuthority',
    'observerLifecycleAuthority',
    'timerLifecycleAuthority',
    'routeTeardownAuthority'
  ]) {
    assert.match(doc, new RegExp(`${token} product source symbol: absent`));
    assert.doesNotMatch(productSource, new RegExp(`\\b${token}\\b`), `${token} should not exist in product source yet`);
  }

  assert.match(readiness, /Runtime lifecycle convergence boundary - 2026-05-30/);
  assert.match(readiness, /It pins 10 runtime lifecycle convergence\s+rows, 0 implementation-ready runtime lifecycle convergence rows/);
  assert.match(readiness, /observer\/listener\/timer\/frame cleanup, route teardown,\s+native-overlay pause rewrites, whitelist\/cache optimization, JSON-first\s+promotion, release claims, and `lifecycleEffectBudget` implementation at\s+`NO-GO`/);
}

test('lifecycle instance register records runtime lifecycle convergence without declaring cleanup', () => {
  assertRuntimeLifecycleConvergenceBoundary();
});
