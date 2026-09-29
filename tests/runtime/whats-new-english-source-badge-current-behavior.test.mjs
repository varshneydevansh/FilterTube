import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const englishCatalog = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/en.json'), 'utf8'));

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.className = '';
    this.attributes = {};
    this._textContent = '';
    this.classList = {
      add: (...names) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach(name => classes.add(name));
        this.className = [...classes].join(' ');
      }
    };
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children = children;
  }

  get childElementCount() {
    return this.children.length;
  }

  set innerHTML(value) {
    if (value === '') this.children = [];
  }

  set textContent(value) {
    this._textContent = value;
  }

  get textContent() {
    return this._textContent || this.children.map(child => child.textContent).join('');
  }
}

function dashboardContext({ locale, notes, translations, localeFetchFails = false }) {
  const list = new FakeElement('div');
  const urls = [];
  const context = {
    document: {
      getElementById: id => id === 'releaseNotesList' ? list : null,
      createElement: tagName => new FakeElement(tagName)
    },
    window: {
      FilterTubeUiLocalization: {
        locale,
        text: key => englishCatalog[key]
      }
    },
    manifestVersion: '3.0.0',
    runtimeAPI: { runtime: { getURL: file => `extension://filtertube/${file}` } },
    fetch: async url => {
      urls.push(url);
      if (url.endsWith(`release_notes.${locale}.json`)) {
        if (localeFetchFails) throw new Error('translation file unavailable');
        return { ok: true, json: async () => translations };
      }
      return { ok: true, json: async () => notes };
    },
    console
  };
  return { context, list, urls };
}

async function renderReleaseNotes(options) {
  const source = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
  const start = source.indexOf('let releaseNotesLoadRevision = 0;');
  const end = source.indexOf("\nwindow.addEventListener('filtertube-ui-locale-changed'", start);
  assert.ok(start >= 0 && end > start, 'release note dashboard function is present');

  const dashboard = dashboardContext(options);
  vm.createContext(dashboard.context);
  await vm.runInContext(`${source.slice(start, end)}\nloadReleaseNotesIntoDashboard()`, dashboard.context);
  return dashboard;
}

const releaseNotes = [
  {
    version: '3.0.0', headline: 'Current English title', summary: 'Current English summary',
    highlights: ['Current English highlight'], detailsUrl: 'https://example.test/releases/3.0.0'
  },
  {
    version: '2.0.0', headline: 'Older English title', summary: 'Older English summary',
    highlights: ['Older English highlight'], detailsUrl: 'https://example.test/releases/2.0.0'
  },
  {
    version: '1.0.0', headline: 'Oldest English title', summary: 'Oldest English summary',
    highlights: ['Oldest English highlight'], detailsUrl: 'https://example.test/releases/1.0.0'
  }
];

test('English catalog supplies the English-source badge copy', () => {
  assert.equal(englishCatalog['release.englishSource'], 'English source');
});

function getBadgeText(card) {
  const header = card.children[0];
  return header.children.find(child => child.className.split(/\s+/).includes('release-note-card__source-status'))?.textContent;
}

test('What’s New labels missing and partial release translations as English source', async () => {
  const { list, urls } = await renderReleaseNotes({
    locale: 'fr',
    notes: releaseNotes,
    translations: {
      '3.0.0': {
        headline: 'Titre français', summary: 'Résumé français', highlights: ['Point français']
      },
      '2.0.0': {
        headline: 'Titre ancien', summary: 'Résumé ancien', highlights: []
      }
    }
  });

  assert.deepEqual(list.children.map(card => card.children[0].children[0].textContent), ['v3.0.0', 'v2.0.0', 'v1.0.0']);
  assert.equal(getBadgeText(list.children[0]), undefined, 'complete current release translation has no source badge');
  assert.equal(getBadgeText(list.children[1]), 'English source', 'partial historical release translation is labeled');
  assert.equal(getBadgeText(list.children[2]), 'English source', 'missing historical release translation is labeled');
  assert.equal(list.children[1].children[2].textContent, 'Résumé ancien');
  assert.equal(list.children[1].children[3].textContent, 'Older English highlight', 'incomplete highlights retain the source text');
  assert.equal(list.children[0].children[4].children[0].href, 'https://example.test/releases/3.0.0');
  assert.deepEqual(urls, [
    'extension://filtertube/data/release_notes.json',
    'extension://filtertube/data/ui_locales/release_notes.fr.json'
  ]);
});

test('What’s New labels all non-English release cards when the locale file cannot load', async () => {
  const { list } = await renderReleaseNotes({
    locale: 'hi', notes: releaseNotes, translations: {}, localeFetchFails: true
  });

  assert.deepEqual(list.children.map(getBadgeText), ['English source', 'English source', 'English source']);
});

test('English What’s New cards do not display the English-source badge', async () => {
  const { list } = await renderReleaseNotes({ locale: 'en', notes: releaseNotes, translations: {} });

  assert.deepEqual(list.children.map(getBadgeText), [undefined, undefined, undefined]);
});
