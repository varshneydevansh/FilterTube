import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MEMBERS_ONLY_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'membersOnlyDomCleanupBoundaryContract',
  'membersOnlyDomCleanupDecisionReport',
  'membersOnlyDomCleanupRestoreProof',
  'membersOnlyDomCleanupSelectorPolicy',
  'membersOnlyDomCleanupTargetShapeReport',
  'membersOnlyDomCleanupRoutePolicy',
  'membersOnlyDomCleanupSiblingFixture',
  'membersOnlyDomCleanupStaleCleanupBudget',
  'membersOnlyDomCleanupMetricArtifact',
  'membersOnlyDomCleanupJsonParityGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function sourceBlocks() {
  const source = read('js/content/dom_fallback.js');
  return {
    source,
    ensureBlock: sliceBetween(source, 'function ensureContentControlStyles(settings) {', 'function hideYouTubeOpenAppButtons()'),
    membersCssBlock: sliceBetween(source, '    if (settings.hideMembersOnly) {', "\n\n    // If :has() isn"),
    membersDirectBlock: sliceBetween(
      source,
      '        if (effectiveSettings.hideMembersOnly) {',
      '        if (effectiveSettings.hidePlaylistCards) {'
    ),
    clearBlock: sliceBetween(source, 'function clearStaleDOMFallbackVisibility() {', '// DOM fallback function that processes already-rendered content'),
    disabledCleanupBlock: sliceBetween(
      source,
      '    if (effectiveSettings.enabled === false) {',
      '    // 1. Video/Content Filtering'
    )
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function createTarget(name, { text = '', aria = '', classes = [] } = {}) {
  const attributes = new Map();
  const classSet = new Set(classes);
  const styleCalls = [];
  const removedProperties = [];
  const target = {
    name,
    textContent: text,
    attributes,
    styleCalls,
    removedProperties,
    closestResult: null,
    style: {
      setProperty(property, value, priority) {
        styleCalls.push({ property, value, priority });
      },
      removeProperty(property) {
        removedProperties.push(property);
      }
    },
    classList: {
      contains(className) {
        return classSet.has(className);
      }
    },
    setAttribute(attribute, value) {
      attributes.set(attribute, String(value));
    },
    getAttribute(attribute) {
      return attributes.has(attribute) ? attributes.get(attribute) : null;
    },
    removeAttribute(attribute) {
      attributes.delete(attribute);
    },
    closest() {
      return target.closestResult;
    }
  };
  if (aria) target.setAttribute('aria-label', aria);
  return target;
}

function createDocument(selectorMap) {
  return {
    selectors: [],
    querySelectorAll(selector) {
      this.selectors.push(selector);
      return selectorMap.get(selector) || [];
    }
  };
}

function runMembersOnlyBlock(document, settings) {
  const { membersDirectBlock } = sourceBlocks();
  const sandbox = { document };
  vm.createContext(sandbox);
  vm.runInContext(`function runBlock(effectiveSettings) {\n${membersDirectBlock}\n}`, sandbox);
  sandbox.runBlock(settings);
}

function isHidden(target) {
  return target.styleCalls.some((call) => (
    call.property === 'display' &&
    call.value === 'none' &&
    call.priority === 'important'
  ));
}

test('members-only DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+selector\s+patch, cleanup patch/);
  assert.match(doc, /members-only DOM cleanup boundary source files: 1/);
  assert.match(doc, /members-only DOM cleanup boundary source\/effect blocks: 5/);
  assert.match(doc, /runtime members-only DOM cleanup fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('members-only DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const { source, ensureBlock, membersCssBlock, membersDirectBlock, clearBlock, disabledCleanupBlock } = sourceBlocks();

  assert.equal(lineCount(ensureBlock), 345);
  assert.equal(Buffer.byteLength(ensureBlock), 12583);
  assert.equal(lineCount(membersCssBlock), 41);
  assert.equal(Buffer.byteLength(membersCssBlock), 2483);
  assert.equal(lineCount(membersDirectBlock), 81);
  assert.equal(Buffer.byteLength(membersDirectBlock), 5060);
  assert.equal(lineCount(clearBlock), 33);
  assert.equal(Buffer.byteLength(clearBlock), 1412);
  assert.equal(lineCount(disabledCleanupBlock), 21);
  assert.equal(Buffer.byteLength(disabledCleanupBlock), 959);

  assert.equal(countLiteral(membersCssBlock, 'rules.push'), 1);
  assert.equal(countLiteral(membersCssBlock, 'display: none !important'), 1);
  assert.equal(countLiteral(membersCssBlock, 'yt-badge-shape--membership'), 11);
  assert.equal(countLiteral(membersCssBlock, 'Members only'), 9);
  assert.equal(countLiteral(membersCssBlock, 'Member-only'), 9);
  assert.equal(countLiteral(membersCssBlock, 'ytd-watch-flexy'), 1);
  assert.equal(countLiteral(membersCssBlock, 'list=UUMO'), 2);

  assert.equal(countLiteral(membersDirectBlock, 'querySelectorAll'), 5);
  assert.equal(countLiteral(membersDirectBlock, '.forEach'), 5);
  assert.equal(countLiteral(membersDirectBlock, "style.setProperty('display', 'none', 'important')"), 5);
  assert.equal(countLiteral(membersDirectBlock, "setAttribute('data-filtertube-hidden', 'true')"), 5);
  assert.equal(countLiteral(membersDirectBlock, "setAttribute('data-filtertube-members-only-hidden', 'true')"), 5);
  assert.equal(countLiteral(membersDirectBlock, "style.removeProperty('display')"), 1);
  assert.equal(countLiteral(membersDirectBlock, "removeAttribute('data-filtertube-hidden')"), 1);
  assert.equal(countLiteral(membersDirectBlock, "removeAttribute('data-filtertube-members-only-hidden')"), 1);
  assert.equal(countLiteral(membersDirectBlock, "'#video-title, #video-title-link, .yt-lockup-metadata-view-model__title'"), 1);
  assert.equal(countLiteral(membersDirectBlock, "'.yt-badge-shape--membership, [aria-label=\"Members only\"], .badge-style-type-membership, ytd-badge-supported-renderer, .yt-badge-shape'"), 1);
  assert.equal(countLiteral(membersDirectBlock, "'a[href*=\"list=UUMO\"], a[title=\"Members-only videos\"], a[href*=\"Members-only videos\"]'"), 1);
  assert.equal(countLiteral(membersDirectBlock, "'ytd-shelf-renderer h2, ytd-shelf-renderer #title'"), 1);
  assert.equal(countLiteral(membersDirectBlock, "'[data-filtertube-members-only-hidden]'"), 1);
  assert.equal(countLiteral(membersDirectBlock, '.closest('), 5);

  assert.equal(countLiteral(clearBlock, 'data-filtertube-members-only-hidden'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'data-filtertube-members-only-hidden'), 0);
  assert.equal(countLiteral(source, 'data-filtertube-members-only-hidden'), 7);
  assert.equal(countLiteral(source, "removeAttribute('data-filtertube-members-only-hidden')"), 1);

  assert.match(doc, /members-only CSS block lines: 41/);
  assert.match(doc, /members-only direct cleanup block bytes: 5060/);
  assert.match(doc, /members-only direct querySelectorAll callsites: 5/);
  assert.match(doc, /members-only direct specialized marker writes: 5/);
  assert.match(doc, /clear-stale cleanup specialized marker references: 0/);
  assert.match(doc, /disabled cleanup specialized marker references: 0/);
  assert.match(doc, /product runtime specialized marker removal callsites: 1/);
});

test('members-only direct cleanup hides title badge link and shelf-title evidence while preserving safe badge hosts', () => {
  const titleHost = createTarget('title-host');
  const badgeHost = createTarget('badge-host');
  const badgeShelf = createTarget('badge-shelf');
  const linkShelf = createTarget('link-shelf');
  const titleShelf = createTarget('title-shelf');
  const safeHost = createTarget('safe-host');
  const titleNode = createTarget('title-node', { aria: 'Members only stream' });
  const badge = createTarget('badge', { classes: ['yt-badge-shape--membership'] });
  const safeBadge = createTarget('safe-badge', { text: 'New' });
  const membershipLink = createTarget('membership-link');
  const shelfTitle = createTarget('shelf-title', { text: 'Members-only videos' });

  titleNode.closestResult = titleHost;
  badge.closestResult = badgeHost;
  badgeHost.closestResult = badgeShelf;
  safeBadge.closestResult = safeHost;
  membershipLink.closestResult = linkShelf;
  shelfTitle.closestResult = titleShelf;

  const selectorMap = new Map([
    ['#video-title, #video-title-link, .yt-lockup-metadata-view-model__title', [titleNode]],
    ['.yt-badge-shape--membership, [aria-label="Members only"], .badge-style-type-membership, ytd-badge-supported-renderer, .yt-badge-shape', [badge, safeBadge]],
    ['a[href*="list=UUMO"], a[title="Members-only videos"], a[href*="Members-only videos"]', [membershipLink]],
    ['ytd-shelf-renderer h2, ytd-shelf-renderer #title', [shelfTitle]],
    ['[data-filtertube-members-only-hidden]', []]
  ]);
  const document = createDocument(selectorMap);

  runMembersOnlyBlock(document, { hideMembersOnly: true });

  for (const target of [titleHost, badgeHost, badgeShelf, linkShelf, titleShelf]) {
    assert.equal(isHidden(target), true, `${target.name} should be hidden`);
    assert.equal(target.getAttribute('data-filtertube-hidden'), 'true');
    assert.equal(target.getAttribute('data-filtertube-members-only-hidden'), 'true');
  }

  assert.equal(isHidden(safeHost), false);
  assert.equal(safeHost.getAttribute('data-filtertube-members-only-hidden'), null);
  assert.deepEqual(document.selectors, [
    '#video-title, #video-title-link, .yt-lockup-metadata-view-model__title',
    '.yt-badge-shape--membership, [aria-label="Members only"], .badge-style-type-membership, ytd-badge-supported-renderer, .yt-badge-shape',
    'a[href*="list=UUMO"], a[title="Members-only videos"], a[href*="Members-only videos"]',
    'ytd-shelf-renderer h2, ytd-shelf-renderer #title'
  ]);
});

test('members-only local toggle-off restore removes inline display and specialized marker', () => {
  const hidden = createTarget('previously-hidden');
  hidden.setAttribute('data-filtertube-hidden', 'true');
  hidden.setAttribute('data-filtertube-members-only-hidden', 'true');
  const document = createDocument(new Map([
    ['[data-filtertube-members-only-hidden]', [hidden]]
  ]));

  runMembersOnlyBlock(document, { hideMembersOnly: false });

  assert.deepEqual(hidden.removedProperties, ['display']);
  assert.equal(hidden.getAttribute('data-filtertube-hidden'), null);
  assert.equal(hidden.getAttribute('data-filtertube-members-only-hidden'), null);
  assert.deepEqual(document.selectors, ['[data-filtertube-members-only-hidden]']);
});

test('members-only specialized marker is omitted by stale and disabled cleanup branches', () => {
  const doc = read(docPath);
  const { source, membersDirectBlock, clearBlock, disabledCleanupBlock } = sourceBlocks();

  assert.equal(countLiteral(membersDirectBlock, 'data-filtertube-members-only-hidden'), 7);
  assert.equal(countLiteral(clearBlock, 'data-filtertube-members-only-hidden'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'data-filtertube-members-only-hidden'), 0);
  assert.equal(countLiteral(source, 'data-filtertube-members-only-hidden'), 7);
  assert.equal(countLiteral(source, "removeAttribute('data-filtertube-members-only-hidden')"), 1);
  assert.match(clearBlock, /\[data-filtertube-hidden\]/);
  assert.match(disabledCleanupBlock, /\[data-filtertube-hidden\]/);

  assert.match(doc, /Stale cleanup and disabled cleanup currently omit the specialized/);
  assert.match(doc, /Restore exists only in this feature-local branch/);
  assert.match(doc, /marker hygiene is not globally owned/);
});

test('members-only DOM cleanup boundary records missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.match(doc, new RegExp(`\\b${symbol}\\b`), `doc missing ${symbol}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${symbol}\\b`), `runtime should not define ${symbol}`);
  }
});
