import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync('js/tab-view.js', 'utf8');

function parserSlice() {
  const start = source.indexOf('    function buildManagedChannelListId');
  const end = source.indexOf('    function findManagedBlockTubePayload');
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}

function loadParser() {
  const normalizeString = (value) => typeof value === 'string' ? value.trim() : (value == null ? '' : String(value).trim());
  const context = vm.createContext({
    URL,
    Date,
    Math,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async () => { throw new Error('not used'); },
    normalizeString,
    safeObject: (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    safeArray: (value) => Array.isArray(value) ? value : [],
    normalizeProfileChannel: (input) => {
      const raw = normalizeString(input);
      if (!raw) return null;
      const isId = /^UC[a-zA-Z0-9_-]{22}$/.test(raw);
      const isHandle = /^@[A-Za-z0-9._-]{2,}$/.test(raw);
      const custom = /^(?:c|user)\/[^\s/?#]+$/i.test(raw);
      if (!isId && !isHandle && !custom) return null;
      return {
        id: isId ? raw : raw,
        name: raw,
        handle: isHandle ? raw : null,
        customUrl: custom ? raw : null,
        originalInput: raw,
        addedAt: Date.now()
      };
    },
    normalizeProfileKeyword: (input) => {
      const word = normalizeString(input);
      return word ? { word, addedAt: Date.now() } : null;
    }
  });
  vm.runInContext(`${parserSlice()}\nthis.__parse = parseManagedChannelListText;`, context, { filename: 'rule-list-parser-slice.js' });
  return context.__parse;
}

test('CSV import accepts template columns, records duplicates, and explains rejected source rows', () => {
  const parse = loadParser();
  const id = `UC${'a'.repeat(22)}`;
  const parsed = parse([
    'channel_id,keyword,notes',
    `${id},,exact id`,
    ',brainrot,keyword',
    `${id},,duplicate`,
    'not-a-channel,,bad row'
  ].join('\n'), { listName: 'CSV list' });
  assert.equal(parsed.sourceFormat, 'csv_channel_keyword_rows');
  assert.equal(parsed.channels.length, 1);
  assert.equal(parsed.keywords.length, 1);
  assert.equal(parsed.duplicateCount, 1);
  assert.equal(parsed.skippedCount, 1);
  assert.equal(parsed.skippedRows[0].row, 5);
  assert.match(parsed.skippedRows[0].reason, /No valid channel identifier/i);
  assert.equal(parsed.channels[0].importSourceRow, 2);
});

test('TXT import keeps bare rows channel-only and requires an explicit keyword prefix', () => {
  const parse = loadParser();
  const id = `UC${'b'.repeat(22)}`;
  const parsed = parse([
    '# title: Hand list',
    `channel: ${id}`,
    'keyword: scary thumbnail',
    'ordinary words are not silently keywords'
  ].join('\n'), { listName: 'TXT list' });
  assert.equal(parsed.sourceFormat, 'typed_text_rows');
  assert.equal(parsed.channels.length, 1);
  assert.equal(parsed.keywords.length, 1);
  assert.equal(parsed.skippedCount, 1);
  assert.equal(parsed.skippedRows[0].row, 4);
  assert.match(parsed.skippedRows[0].reason, /Bare TXT rows are channels/i);
});

test('FilterTube JSON rules preserve source positions and malformed JSON is never reinterpreted as TXT', () => {
  const parse = loadParser();
  const id = `UC${'c'.repeat(22)}`;
  const parsed = parse(JSON.stringify({
    schema: 'filtertube_rule_list',
    rules: [
      { type: 'channel', value: id },
      { type: 'keyword', value: 'brainrot' },
      { type: 'channel', value: '' }
    ]
  }), { listName: 'JSON list' });
  assert.equal(parsed.sourceFormat, 'filtertube_rule_list_json');
  assert.equal(parsed.channels[0].importSourceRow, 1);
  assert.equal(parsed.keywords[0].importSourceRow, 2);
  assert.equal(parsed.skippedRows[0].row, 3);
  assert.throws(
    () => parse('{"schema":"filtertube_rule_list","rules":[}', { listName: 'broken' }),
    /not valid JSON/i
  );
});

test('downloadable TXT and JSON starter templates cannot import their example values unchanged', () => {
  assert.match(source, /'# channel: @SomeChannel'/);
  assert.match(source, /'# keyword: brainrot'/);
  assert.match(source, /rules:\s*\[\],\s*examples:/);
});
