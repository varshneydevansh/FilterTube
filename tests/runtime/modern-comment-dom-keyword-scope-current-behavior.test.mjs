import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');

function fixture() {
  const nodes = [];
  class Element {
    constructor(tagName, textContent = '', parent = null, id = '') {
      Object.assign(this, { tagName: tagName.toUpperCase(), ownText: textContent, parent, id, hidden: false, attributes: new Map() });
      this.classList = { remove() {}, contains: () => false };
      nodes.push(this);
    }
    get textContent() { return this.ownText + nodes.filter(node => node.parent === this).map(node => node.textContent).join(' '); }
    getAttribute(name) { return this.attributes.get(name) || ''; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    removeAttribute(name) { this.attributes.delete(name); }
    matches(selector) {
      return selector.split(',').some(part => {
        part = part.trim();
        if (part === '[data-filtertube-hidden]' || part === '.filtertube-hidden') return this.hidden;
        if (/^#[\w-]+$/.test(part)) return this.id === part.slice(1);
        return /^[a-z][a-z0-9-]*$/.test(part) && part === this.tagName.toLowerCase();
      });
    }
    closest(selector) { for (let node = this; node; node = node.parent) if (node.matches(selector)) return node; return null; }
    contains(node) { for (let parent = node; parent; parent = parent.parent) if (parent === this) return true; return false; }
    querySelectorAll(selector) { return nodes.filter(node => node !== this && this.contains(node) && node.matches(selector)); }
    querySelector(selector) {
      if (selector.includes('author-text')) return this.author || nodes.find(node => node !== this && this.contains(node) && node.author)?.author
        || { textContent: 'Unrelated author', getAttribute: () => '/@unrelated' };
      if (selector.startsWith(':scope >')) return nodes.find(node => node.parent === this && node.matches(selector.replaceAll(':scope > ', ''))) || null;
      return this.querySelectorAll(selector)[0] || null;
    }
  }
  const container = new Element('ytd-comments', '', null, 'comments');
  const video = new Element('ytd-video-renderer', 'A video title containing needle');
  const document = {
    location: { pathname: '/watch', hostname: 'www.youtube.com' }, documentElement: { removeAttribute() {}, getAttribute: () => '' },
    querySelectorAll: selector => nodes.filter(node => node.matches(selector)),
    querySelector: () => null, getElementById: () => null
  };
  const context = vm.createContext({
    window: {}, document, Element, currentSettings: null, Date, URL,
    console: { log() {}, info() {}, debug() {}, warn() {}, error() {} }, setTimeout: () => 1, clearTimeout() {},
    buildChannelMetadata: (name, href) => ({ name, handle: href.startsWith('/@') ? href.slice(1) : '' }),
    getCurrentWatchVideoId: () => 'CURRENT0001'
  });
  vm.runInContext(source, context);
  context.toggleVisibility = (node, hidden) => { node.hidden = hidden; };
  return { context, nodes, Element, container, video };
}

const policy = overrides => ({ enabled: true, listMode: 'blocklist', filterChannels: [], filterKeywords: [], filterKeywordsComments: [{ pattern: 'needle', flags: 'i' }], ...overrides });

function author(node, handle) {
  node.author = { textContent: handle, getAttribute: () => `/${handle}` };
}

function threadWithReplies(f, prefix, model, { parentText = 'Ordinary parent.', replyText = 'A reply with needle.' } = {}) {
  const thread = new f.Element(`${prefix}-comment-thread-renderer`, '', f.container);
  const parent = new f.Element(`${prefix}-comment-${model}`, parentText, thread);
  const replies = new f.Element(`${prefix}-comment-replies-renderer`, '', thread, 'replies');
  const matchingReply = new f.Element(`${prefix}-comment-${model}`, replyText, replies);
  const siblingReply = new f.Element(`${prefix}-comment-${model}`, 'An ordinary sibling reply.', replies);
  return { thread, parent, replies, matchingReply, siblingReply };
}

for (const [prefix, model] of [['ytd', 'renderer'], ['ytm', 'renderer'], ['ytd', 'view-model'], ['ytm', 'view-model'], ['yt', 'renderer'], ['yt', 'view-model']]) {
  test(`${prefix} ${model}: a matching reply hides only itself and preserves its parent and sibling`, () => {
    const f = fixture();
    const family = threadWithReplies(f, prefix, model);
    f.context.handleCommentsFallback(policy());
    assert.equal(family.matchingReply.hidden, true);
    assert.equal(family.siblingReply.hidden, false);
    assert.equal(family.parent.hidden, false);
    assert.equal(family.thread.hidden, false);
    assert.equal(family.replies.hidden, false);
    assert.equal(f.container.hidden, false);
    assert.equal(f.video.hidden, false);
  });

  test(`${prefix} ${model}: a matching top-level comment can hide the whole thread`, () => {
    const f = fixture();
    const family = threadWithReplies(f, prefix, model, { parentText: 'The parent contains needle.', replyText: 'An ordinary reply.' });
    f.context.handleCommentsFallback(policy());
    assert.equal(family.thread.hidden, true);
    assert.equal(f.container.hidden, false);
    assert.equal(f.video.hidden, false);
  });

  test(`${prefix} ${model}: a blocked reply author never hides or stamps its parent thread`, () => {
    const f = fixture();
    const family = threadWithReplies(f, prefix, model, { replyText: 'An ordinary reply.' });
    author(family.parent, '@ordinary'); author(family.matchingReply, '@blocked'); author(family.siblingReply, '@other');
    f.context.handleCommentsFallback(policy({ filterKeywordsComments: [], filterChannels: [{ handle: '@blocked' }] }));
    assert.equal(family.matchingReply.hidden, true);
    assert.equal(family.thread.hidden, false);
    assert.equal(family.parent.hidden, false);
    assert.equal(family.siblingReply.hidden, false);
    assert.equal(family.thread.getAttribute('data-filtertube-blocked-channel-handle'), '');
    f.context.markElementAsBlocked(family.matchingReply, { handle: '@blocked' }, 'pending');
    f.context.handleCommentsFallback(policy({ filterKeywordsComments: [], filterChannels: [{ handle: '@blocked' }] }));
    assert.equal(family.matchingReply.getAttribute('data-filtertube-blocked-state'), 'confirmed');
    assert.equal(family.thread.getAttribute('data-filtertube-blocked-channel-handle'), '', 'confirming a reply stamp never promotes it to thread authority');
    assert.equal(family.thread.hidden, false);
    assert.equal(family.siblingReply.hidden, false);
  });

  test(`${prefix} ${model}: a blocked top-level author can hide the whole thread`, () => {
    const f = fixture();
    const family = threadWithReplies(f, prefix, model, { replyText: 'An ordinary reply.' });
    author(family.parent, '@blocked'); author(family.matchingReply, '@ordinary');
    f.context.handleCommentsFallback(policy({ filterKeywordsComments: [], filterChannels: [{ handle: '@blocked' }] }));
    assert.equal(family.thread.hidden, true);
    assert.equal(f.container.hidden, false);
    assert.equal(f.video.hidden, false);
  });
}

test('a reply-only thread waiting for its root does not promote its first reply to the root', () => {
  const f = fixture();
  const thread = new f.Element('yt-comment-thread-renderer', '', f.container);
  const replies = new f.Element('yt-comment-replies-renderer', '', thread, 'replies');
  const reply = new f.Element('yt-comment-view-model', 'A reply containing needle.', replies);
  f.context.handleCommentsFallback(policy());
  assert.equal(reply.hidden, true);
  assert.equal(thread.hidden, false);
  assert.equal(replies.hidden, false);
});

test('a nested reply thread owns its root without inheriting the outer reply container', () => {
  const f = fixture();
  const outer = threadWithReplies(f, 'yt', 'view-model', { replyText: 'Ordinary reply.' });
  const nested = new f.Element('yt-comment-thread-renderer', '', outer.replies);
  new f.Element('yt-comment-view-model', 'Nested reply root containing needle.', nested);
  f.context.handleCommentsFallback(policy());
  assert.equal(nested.hidden, true);
  assert.equal(outer.thread.hidden, false);
  assert.equal(outer.parent.hidden, false);
  assert.equal(outer.siblingReply.hidden, false);
});

test('renderer wrappers and nested view-models share only their own top-level thread ownership', () => {
  const f = fixture();
  const thread = new f.Element('ytd-comment-thread-renderer', '', f.container);
  const root = new f.Element('ytd-comment-renderer', '', thread);
  new f.Element('ytd-comment-view-model', 'Ordinary top-level comment.', root);
  const replies = new f.Element('ytd-comment-replies-renderer', '', thread, 'replies');
  const reply = new f.Element('ytd-comment-renderer', '', replies);
  const replyModel = new f.Element('ytd-comment-view-model', 'Reply containing needle.', reply);
  f.context.handleCommentsFallback(policy());
  assert.equal(thread.hidden, false);
  assert.equal(root.hidden, false);
  assert.equal(reply.hidden, true);
  assert.equal(replyModel.hidden, true);
});

test('Disabled restores a matching reply without hiding its parent, sibling, composer or video neighbor', async () => {
  const f = fixture();
  const family = threadWithReplies(f, 'yt', 'view-model');
  const composer = new f.Element('yt-comment-simplebox-renderer', '', f.container);
  new f.Element('yt-comment-view-model', 'Draft containing needle.', composer);
  f.context.handleCommentsFallback(policy());
  assert.equal(family.matchingReply.hidden, true);
  f.context.currentSettings = policy({ enabled: false });
  await f.context.applyDOMFallback(f.context.currentSettings);
  for (const node of [family.thread, family.parent, family.matchingReply, family.siblingReply, composer, f.video]) assert.equal(node.hidden, false);
});

for (const tag of ['yt-comment-thread-renderer', 'yt-comment-renderer', 'yt-comment-view-model']) {
  test(`modern ${tag} applies the real serialized comment matcher inside a sentence and preserves siblings`, () => {
    const f = fixture();
    const matching = new f.Element(tag, 'The needle occurs inside this sentence.', f.container);
    const sibling = new f.Element(tag, 'An ordinary unrelated comment.', f.container);
    f.context.handleCommentsFallback(policy());
    assert.equal(matching.hidden, true);
    assert.equal(sibling.hidden, false);
    assert.equal(f.container.hidden, false, 'keyword filtering never hides the whole comment sheet');
    assert.equal(f.video.hidden, false, 'a comment-only rule does not filter video titles');
  });
}

test('modern comments preserve explicit empty comment scope and do not inherit video-only keywords', () => {
  const f = fixture();
  const comment = new f.Element('yt-comment-view-model', 'The needle is inside this comment.', f.container);
  f.context.handleCommentsFallback(policy({ filterKeywords: [{ pattern: 'needle', flags: 'i' }], filterKeywordsComments: [] }));
  assert.equal(comment.hidden, false);
});

test('modern comments remain outside allow-only video admission and composers are not filtered', () => {
  const f = fixture();
  const ordinary = new f.Element('yt-comment-view-model', 'Unrelated text.', f.container);
  const composer = new f.Element('yt-comment-simplebox-renderer', '', f.container);
  const draft = new f.Element('yt-comment-view-model', 'Unsent draft with needle.', composer);
  f.context.handleCommentsFallback(policy({ listMode: 'whitelist', whitelistChannels: [], whitelistKeywords: [] }));
  assert.equal(ordinary.hidden, false);
  assert.equal(draft.hidden, false);
  assert.equal(composer.hidden, false);
});

test('modern thread hide-all and Disabled restoration use the existing comment and global cleanup paths', async () => {
  const f = fixture();
  const thread = new f.Element('yt-comment-thread-renderer', 'Unrelated comment.', f.container);
  f.context.handleCommentsFallback(policy({ hideAllComments: true }));
  assert.equal(thread.hidden, true);
  assert.equal(f.container.hidden, true);
  f.context.currentSettings = policy({ enabled: false, hideAllComments: true });
  await f.context.applyDOMFallback(f.context.currentSettings);
  assert.equal(thread.hidden, false);
  assert.equal(f.container.hidden, false);
  assert.equal(f.video.hidden, false);
});
