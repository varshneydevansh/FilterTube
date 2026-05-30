import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/filter_logic.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
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

function scanToEnd(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let comment = null;
  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (comment === 'line') {
      if (char === '\n') comment = null;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        comment = null;
        i += 1;
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
      comment = 'line';
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      comment = 'block';
      i += 1;
      continue;
    }
    if (['"', "'", '`'].includes(char)) {
      quote = char;
      continue;
    }
    if (char === '{' || char === '[') depth += 1;
    if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  assert.fail(`missing object/array close from ${openIndex}`);
}

function findConstObject(source, name) {
  const startNeedle = `const ${name} = {`;
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${name}`);
  const braceStart = source.indexOf('{', start);
  return { name, start, braceStart, end: scanToEnd(source, braceStart) };
}

function topLevelEntries(source, starts, braceStart, end) {
  const rows = [];
  let depth = 1;
  let quote = null;
  let escaped = false;
  let comment = null;
  let token = '';
  let tokenStart = -1;

  for (let i = braceStart + 1; i < end; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (comment === 'line') {
      if (char === '\n') comment = null;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        comment = null;
        i += 1;
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
      comment = 'line';
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      comment = 'block';
      i += 1;
      continue;
    }
    if (['"', "'", '`'].includes(char)) {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      continue;
    }
    if (depth !== 1) continue;
    if (/[A-Za-z0-9_$]/.test(char)) {
      if (!token) tokenStart = i;
      token += char;
      continue;
    }
    if (char === ':' && token) {
      let valueStart = i + 1;
      while (/\s/.test(source[valueStart])) valueStart += 1;
      let valueEnd;
      let valueShape;
      if (source.startsWith('BASE_VIDEO_RULES', valueStart)) {
        valueShape = 'BASE_VIDEO_RULES';
        valueEnd = valueStart + 'BASE_VIDEO_RULES'.length;
      } else if (source[valueStart] === '{') {
        valueShape = 'objectLiteral';
        valueEnd = scanToEnd(source, valueStart) + 1;
      } else if (source[valueStart] === '[') {
        valueShape = 'arrayLiteral';
        valueEnd = scanToEnd(source, valueStart) + 1;
      } else {
        let cursor = valueStart;
        while (cursor < end && source[cursor] !== ',' && source[cursor] !== '\n') cursor += 1;
        valueEnd = cursor;
        valueShape = 'primitive';
      }
      rows.push({
        name: token,
        line: lineForIndex(starts, tokenStart),
        valueStart,
        valueEnd,
        valueShape,
        text: source.slice(valueStart, valueEnd)
      });
      token = '';
      tokenStart = -1;
      i = valueEnd;
      continue;
    }
    if (!/\s/.test(char) && char !== ',') {
      token = '';
      tokenStart = -1;
    }
  }
  return rows;
}

function stringLiterals(source, starts, text, offset) {
  const rows = [];
  let comment = null;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (comment === 'line') {
      if (char === '\n') comment = null;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        comment = null;
        i += 1;
      }
      continue;
    }
    if (char === '/' && next === '/') {
      comment = 'line';
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      comment = 'block';
      i += 1;
      continue;
    }
    if (!['"', "'", '`'].includes(char)) continue;
    let value = '';
    let escaped = false;
    let hasTemplate = false;
    for (let cursor = i + 1; cursor < text.length; cursor += 1) {
      const valueChar = text[cursor];
      if (escaped) {
        value += valueChar;
        escaped = false;
        continue;
      }
      if (valueChar === '\\') {
        escaped = true;
        continue;
      }
      if (char === '`' && valueChar === '$' && text[cursor + 1] === '{') hasTemplate = true;
      if (valueChar === char) {
        rows.push({
          value,
          line: lineForIndex(starts, offset + i),
          hasTemplate
        });
        i = cursor;
        break;
      }
      value += valueChar;
    }
  }
  return rows;
}

function rulePathState() {
  const source = read(sourcePath);
  const starts = lineStarts(source);
  const base = findConstObject(source, 'BASE_VIDEO_RULES');
  const rules = findConstObject(source, 'FILTER_RULES');
  const baseFields = topLevelEntries(source, starts, base.braceStart, base.end);
  const ruleEntries = topLevelEntries(source, starts, rules.braceStart, rules.end);

  function rowsForEntry(entry) {
    const rows = [];
    if (entry.valueShape === 'BASE_VIDEO_RULES') {
      for (const field of baseFields) {
        for (const literal of stringLiterals(source, starts, field.text, field.valueStart)) {
          rows.push({
            renderer: entry.name,
            ruleLine: entry.line,
            field: field.name,
            path: literal.value,
            pathLine: literal.line,
            declarationShape: 'BASE_VIDEO_RULES',
            hasTemplate: literal.hasTemplate
          });
        }
      }
      return rows;
    }
    if (entry.valueShape !== 'objectLiteral') return rows;
    for (const field of topLevelEntries(source, starts, entry.valueStart, entry.valueEnd - 1)) {
      for (const literal of stringLiterals(source, starts, field.text, field.valueStart)) {
        rows.push({
          renderer: entry.name,
          ruleLine: entry.line,
          field: field.name,
          path: literal.value,
          pathLine: literal.line,
          declarationShape: field.valueShape,
          hasTemplate: literal.hasTemplate
        });
      }
    }
    return rows;
  }

  const baseRows = baseFields.flatMap((field) =>
    stringLiterals(source, starts, field.text, field.valueStart).map((literal) => ({
      renderer: 'BASE_VIDEO_RULES',
      field: field.name,
      path: literal.value,
      pathLine: literal.line
    }))
  );
  const sourceRows = ruleEntries.flatMap(rowsForEntry);
  const effectiveEntries = new Map();
  for (const entry of ruleEntries) effectiveEntries.set(entry.name, entry);
  const effectiveRows = [...effectiveEntries.values()].flatMap(rowsForEntry);

  return { source, baseFields, ruleEntries, baseRows, sourceRows, effectiveEntries: [...effectiveEntries.values()], effectiveRows };
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function pathGroup(field) {
  if (field === 'videoId') return 'videoIdentityPath';
  if (['channelName', 'channelId', 'channelHandle'].includes(field)) return 'channelIdentityPath';
  if (['title', 'description', 'commentText'].includes(field)) return 'textMatchPath';
  if (['duration', 'publishedTime', 'viewCount', 'metadataRows'].includes(field)) return 'metadataPredicatePath';
  return 'otherPath';
}

function syntaxCounts(rows) {
  const counts = { dotIndex: 0, bracketIndex: 0, bareOrDotNoIndex: 0, template: 0 };
  for (const row of rows) {
    if (/\[\d+\]/.test(row.path)) counts.bracketIndex += 1;
    else if (/\.\d+(\.|$)/.test(row.path)) counts.dotIndex += 1;
    else counts.bareOrDotNoIndex += 1;
    if (row.hasTemplate) counts.template += 1;
  }
  return counts;
}

test('filter logic rule path register is audit-only and source scoped', () => {
  const text = doc();
  const { source } = rulePathState();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/filter_logic\.js/);
  assert.match(text, /path owner object: FILTER_RULES/);
  assert.match(text, /shared alias object: BASE_VIDEO_RULES/);
  assert.equal(sourceLineCount(source), 3498);
  assert.equal(fs.statSync(path.join(repoRoot, sourcePath)).size, 165151);
  assert.match(text, /source line count: 3498/);
  assert.match(text, /source bytes: 165151/);
  assert.match(text, new RegExp(`source sha256: ${sha256(sourcePath)}`));
});

test('filter logic rule path register pins source and effective path counts', () => {
  const text = doc();
  const { baseFields, ruleEntries, baseRows, sourceRows, effectiveEntries, effectiveRows } = rulePathState();
  const uniquePaths = new Set(effectiveRows.map((row) => row.path));
  const rendererFields = new Set(effectiveRows.map((row) => `${row.renderer}.${row.field}`));
  const syntax = syntaxCounts(effectiveRows);

  assert.equal(baseFields.length, 9);
  assert.equal(baseRows.length, 27);
  assert.equal(ruleEntries.length, 45);
  assert.equal(sourceRows.length, 467);
  assert.equal(baseRows.length + sourceRows.length, 494);
  assert.equal(effectiveEntries.length, 44);
  assert.equal(effectiveEntries.filter((entry) => entry.valueShape === 'BASE_VIDEO_RULES').length, 6);
  assert.equal(effectiveEntries.filter((entry) => entry.valueShape === 'objectLiteral').length, 38);
  assert.equal(effectiveRows.length, 440);
  assert.equal(uniquePaths.size, 174);
  assert.equal(rendererFields.size, 177);
  assert.deepEqual(syntax, {
    dotIndex: 157,
    bracketIndex: 0,
    bareOrDotNoIndex: 283,
    template: 0
  });

  for (const [label, value] of [
    ['BASE_VIDEO_RULES field rows', 9],
    ['BASE_VIDEO_RULES authored path rows', 27],
    ['FILTER_RULES source declarations', 45],
    ['FILTER_RULES source path rows before duplicate override', 467],
    ['source-authored path rows including BASE_VIDEO_RULES', 494],
    ['effective runtime renderer keys after duplicate override', 44],
    ['effective BASE_VIDEO_RULES aliases after duplicate override', 6],
    ['effective object literal rules after duplicate override', 38],
    ['effective runtime path rows after duplicate override', 440],
    ['effective unique path literals', 174],
    ['effective renderer-field pairs', 177],
    ['path syntax with dot numeric indexes', 157],
    ['path syntax with bracket numeric indexes', 0],
    ['path syntax without numeric indexes', 283],
    ['template path literals', 0]
  ]) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }
});

test('filter logic rule path register preserves effective field and semantic group counts', () => {
  const text = doc();
  const { effectiveRows } = rulePathState();
  const fieldCounts = countBy(effectiveRows, 'field');
  const groupCounts = {};
  for (const row of effectiveRows) {
    const group = pathGroup(row.field);
    groupCounts[group] = (groupCounts[group] || 0) + 1;
  }

  assert.deepEqual(fieldCounts, {
    channelHandle: 49,
    channelId: 48,
    channelName: 55,
    commentText: 2,
    description: 63,
    duration: 48,
    metadataRows: 3,
    publishedTime: 38,
    title: 86,
    videoId: 34,
    viewCount: 14
  });
  assert.deepEqual(Object.fromEntries(Object.entries(groupCounts).sort()), {
    channelIdentityPath: 152,
    metadataPredicatePath: 103,
    textMatchPath: 151,
    videoIdentityPath: 34
  });

  for (const [field, count] of Object.entries(fieldCounts)) {
    assert.ok(text.includes(`| \`${field}\` | ${count} |`), `missing field count for ${field}`);
  }
  for (const [group, count] of Object.entries(groupCounts)) {
    assert.match(text, new RegExp(`\\| ${escapeRegExp(`\`${group}\``)} \\|[^|]+\\| ${count} \\|`));
  }
});

test('filter logic rule path register lists every unique effective runtime path literal', () => {
  const text = doc();
  const { effectiveRows } = rulePathState();
  const uniquePaths = [...new Set(effectiveRows.map((row) => row.path))].sort();

  assert.equal(uniquePaths.length, 174);
  for (const pathLiteral of uniquePaths) {
    assert.ok(text.includes(`\`${pathLiteral}\``), `missing effective path literal ${pathLiteral}`);
  }
});

test('filter logic rule path register pins duplicate syntax documentation and future proof fields', () => {
  const text = doc();

  for (const token of [
    'gridVideoRenderer is declared twice in source',
    'BASE_VIDEO_RULES at line 431',
    'object literal at line 604',
    'source FILTER_RULES path rows before duplicate override: 467',
    'effective runtime path rows after duplicate override: 440',
    'all current runtime paths use dot-index syntax',
    'no current runtime path uses bracket-index syntax',
    'docs/json_paths_encyclopedia.md uses documented field text',
    'runtime/build source does not load it'
  ]) {
    assert.ok(text.includes(token), `missing boundary token ${token}`);
  }

  for (const field of [
    'rulePathReference',
    'sourceFile',
    'sourceLine',
    'rendererKey',
    'effectiveRuntimeKey',
    'fieldName',
    'semanticPathGroup',
    'rawPathLiteral',
    'normalizedRuntimePath',
    'pathSyntax',
    'duplicateOverridePolicy',
    'baseAliasPolicy',
    'documentedJsonSection',
    'routeOrEndpoint',
    'surface',
    'profileType',
    'listMode',
    'ruleState',
    'sourceTier',
    'identityConfidence',
    'allowedEffect',
    'forbiddenEffect',
    'positiveFixture',
    'whitelistFixture',
    'emptyListFixture',
    'disabledFixture',
    'negativeSiblingFixture',
    'domFallbackParityFixture',
    'nativeRuntimeParityFixture',
    'fixtureProvenance',
    'noRuleBudget',
    'restoreProof'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks filter logic rule path authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  for (const authority of [
    'filterLogicRulePathAuthority',
    'filterLogicRulePathManifest',
    'filterLogicRulePathSyntaxContract',
    'filterLogicEffectiveRendererPathReport',
    'filterLogicDuplicatePathOverridePolicy',
    'filterLogicJsonDomParityReport',
    'filterLogicPathFixtureProvenance',
    'filterLogicJsonFirstReadinessGate',
    'filterLogicPathEffectDecision',
    'filterLogicPathNoRuleBudget'
  ]) {
    assert.match(text, new RegExp(authority));
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`));
  }
});
