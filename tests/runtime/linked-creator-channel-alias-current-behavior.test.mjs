import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadRosterAliasRuntime() {
  const source = read('js/injector.js');
  const block = sliceBetween(
    source,
    'function attachCardChannelAliasToCollaboratorRoster(renderer, collaborators) {',
    'function getCollaboratorListQuality'
  );
  const context = {
    sanitizeCollaboratorList(list = []) {
      return list.map(item => {
        const alternateIds = Array.isArray(item.alternateIds) ? [...item.alternateIds] : [];
        return {
          ...item,
          ...(alternateIds.length > 0 ? { alternateIds } : {})
        };
      });
    },
    markCollaboratorListSource(list, sourceLabel) {
      Object.defineProperty(list, '__filterTubeCollaboratorSource', {
        value: sourceLabel,
        configurable: true
      });
      return list;
    },
    getCollaboratorListSource(list) {
      return list?.__filterTubeCollaboratorSource || '';
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${block}\nglobalThis.attachAlias = attachCardChannelAliasToCollaboratorRoster;`, context);
  return context.attachAlias;
}

function loadSoloMergeRuntime() {
  const source = read('js/injector.js');
  const block = sliceBetween(
    source,
    'function mergeChannelCandidates(...candidates) {',
    'function searchYtInitialDataForVideoChannel'
  );
  const context = {};
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${block}\nglobalThis.mergeChannelCandidates = mergeChannelCandidates;`, context);
  return context.mergeChannelCandidates;
}

function loadIdentity() {
  const source = read('js/shared/identity.js');
  const context = {
    window: { FilterTubeIdentity: {} },
    URL,
    JSON,
    decodeURIComponent,
    console
  };
  context.self = context.window;
  context.globalThis = context.window;
  vm.runInNewContext(source, context, { filename: 'js/shared/identity.js' });
  return context.window.FilterTubeIdentity;
}

function authoritativeRoster() {
  const rows = [
    {
      name: 'shakiraVEVO',
      handle: '@shakiraVEVO',
      id: 'UCGnjeahCJW1AF34HBmQTJ-Q',
      customUrl: '/@shakiraVEVO',
      logo: 'https://yt3.googleusercontent.com/shakira-avatar'
    },
    {
      name: 'Spotify',
      handle: '@Spotify',
      id: 'UCRMqQWxCWE0VMvtUElm-rEA',
      customUrl: '/@Spotify'
    }
  ];
  Object.defineProperty(rows, '__filterTubeCollaboratorSource', {
    value: 'collaborators-sheet',
    configurable: true
  });
  return rows;
}

function cardRenderer({ label = 'Go to channel shakiraVEVO', id = 'UCYLNGLIzMhRTi6ZOLjAPSmw' } = {}) {
  return {
    channelThumbnail: {
      channelThumbnailWithLinkRenderer: {
        accessibility: { accessibilityData: { label } },
        navigationEndpoint: { browseEndpoint: { browseId: id } }
      }
    }
  };
}

test('one authoritative Shakira roster member retains both video-scoped UC ids without adding a collaborator', () => {
  const attachAlias = loadRosterAliasRuntime();
  const result = attachAlias(cardRenderer(), authoritativeRoster());

  assert.equal(result.length, 2);
  assert.equal(result.__filterTubeCollaboratorSource, 'collaborators-sheet');
  assert.deepEqual(plain(result[0]), {
    name: 'shakiraVEVO',
    handle: '@shakiraVEVO',
    id: 'UCGnjeahCJW1AF34HBmQTJ-Q',
    customUrl: '/@shakiraVEVO',
    logo: 'https://yt3.googleusercontent.com/shakira-avatar',
    alternateIds: ['UCYLNGLIzMhRTi6ZOLjAPSmw']
  });
  assert.equal(result[1].alternateIds, undefined);
});

test('card channel id is not linked without one exact roster-label match', () => {
  const attachAlias = loadRosterAliasRuntime();
  const mismatched = attachAlias(cardRenderer({ label: 'Go to channel unrelated' }), authoritativeRoster());

  const ambiguousRoster = authoritativeRoster();
  ambiguousRoster[1] = { ...ambiguousRoster[1], name: 'shakiraVEVO' };
  const ambiguous = attachAlias(cardRenderer(), ambiguousRoster);

  assert.equal(mismatched[0].alternateIds, undefined);
  assert.equal(ambiguous[0].alternateIds, undefined);
  assert.equal(ambiguous[1].alternateIds, undefined);
});

test('solo video signals with the same exact identity retain a second UC id', () => {
  const merge = loadSoloMergeRuntime();
  const result = merge(
    { id: 'UCYLNGLIzMhRTi6ZOLjAPSmw', name: 'shakiraVEVO' },
    { id: 'UCGnjeahCJW1AF34HBmQTJ-Q', handle: '@shakiraVEVO', name: 'shakiraVEVO' }
  );

  assert.equal(result.id, 'UCYLNGLIzMhRTi6ZOLjAPSmw');
  assert.deepEqual(plain(result.alternateIds), ['UCGnjeahCJW1AF34HBmQTJ-Q']);
  assert.equal(result.name, 'shakiraVEVO');
});

test('solo signals with different labels remain separate and do not manufacture aliases', () => {
  const merge = loadSoloMergeRuntime();
  const result = merge(
    { id: 'UCYLNGLIzMhRTi6ZOLjAPSmw', name: 'Shakira' },
    { id: 'UCRMqQWxCWE0VMvtUElm-rEA', handle: '@Spotify', name: 'Spotify' }
  );

  assert.equal(result.id, 'UCYLNGLIzMhRTi6ZOLjAPSmw');
  assert.deepEqual(plain(result.alternateIds), []);
});

test('a single stored creator rule matches either linked UC id in both directions', () => {
  const identity = loadIdentity();
  const rule = {
    id: 'UCGnjeahCJW1AF34HBmQTJ-Q',
    alternateIds: ['UCYLNGLIzMhRTi6ZOLjAPSmw'],
    handle: '@shakiraVEVO',
    name: 'shakiraVEVO'
  };

  assert.equal(identity.channelMatchesFilter({ id: 'UCGnjeahCJW1AF34HBmQTJ-Q' }, rule), true);
  assert.equal(identity.channelMatchesFilter({ id: 'UCYLNGLIzMhRTi6ZOLjAPSmw' }, rule), true);
  assert.equal(identity.channelMatchesFilter(rule, { id: 'UCYLNGLIzMhRTi6ZOLjAPSmw' }), true);
  assert.equal(identity.isChannelBlocked([rule], { id: 'UCYLNGLIzMhRTi6ZOLjAPSmw' }), true);
  assert.equal(identity.isChannelBlocked([rule], { id: 'UCRMqQWxCWE0VMvtUElm-rEA' }), false);
});

test('bridge, persistence and imports retain linked ids as metadata rather than collaborator rows', () => {
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const settings = read('js/settings_shared.js');
  const io = read('js/io_manager.js');

  assert.match(bridge, /alternateIds: Array\.isArray\(metadata\.alternateIds\) \? metadata\.alternateIds : \[\]/);
  assert.match(bridge, /if \(!match\.logo && extra\.logo\) match\.logo = extra\.logo/);
  assert.match(read('js/injector.js'), /logo: extractChannelLogoFromObject\(viewModel\)/);
  assert.match(background, /channelInfo\.alternateIds = incomingAlternateIds/);
  assert.match(background, /for \(const alternateId of normalizeAlternateChannelIds\(finalChannelData\.alternateIds/);
  assert.match(settings, /const alternateIds = Array\.from\(new Set\(/);
  assert.match(io, /merged\.alternateIds = Array\.from\(new Set\(/);
  assert.match(io, /\.\.\.\(alternateIds\.length > 0 \? \{ alternateIds \} : \{\}\)/);
});
