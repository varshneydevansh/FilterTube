// "Comments from X hidden · Undo" on the site (Android NativeCommentsHiddenNote and the comments
// sheet's hiddenAuthorStrip): blocking a comment's author leaves a quiet strip in its place, and Undo
// takes the block back (the background allows it only for its own blocks of the last 10 minutes).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function sliceBetween(source, start, end) {
    const from = source.indexOf(start);
    assert.notEqual(from, -1, start);
    return source.slice(from, source.indexOf(end, from + start.length));
}

function fakeElement(tag) {
    return {
        tag, children: [], attributes: {}, style: {}, textContent: '', parentNode: null, handlers: {}, disabled: false,
        setAttribute(key, value) { this.attributes[key] = String(value); },
        getAttribute(key) { return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null; },
        append(...nodes) { nodes.forEach(node => { node.parentNode = this; this.children.push(node); }); },
        insertBefore(node, ref) { node.parentNode = this; const at = this.children.indexOf(ref); this.children.splice(at < 0 ? this.children.length : at, 0, node); return node; },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; },
        get previousElementSibling() { const list = this.parentNode?.children || []; return list[list.indexOf(this) - 1] || null; }
    };
}

test('blocking a comment\'s author leaves "Comments from X hidden · Undo" in its place, and Undo asks the background', () => {
    const source = fs.readFileSync('js/content_bridge.js', 'utf8');
    const block = sliceBetween(source, 'function showCommentAuthorHiddenNote(', 'function resolveCommentHideTarget(');
    const sent = [];
    const context = {
        document: { createElement: fakeElement, documentElement: { hasAttribute: () => false, getAttribute: () => null }, querySelectorAll: () => [] },
        browserAPI_BRIDGE: { runtime: { sendMessage: (message, cb) => { sent.push(message); cb({ success: true }); } } },
        filterTubeContentMenuText: (key, fallback, values = {}) => String(fallback).replace(/\{(\w+)\}/g, (m, name) => values[name] ?? m),
        requestSettingsFromBackground: async () => ({ success: false }), applyDOMFallback: () => {}, currentSettings: {}
    };
    vm.createContext(context);
    vm.runInContext(`${block}\nthis.show = showCommentAuthorHiddenNote;`, context);
    const list = fakeElement('div');
    const comment = fakeElement('ytd-comment-thread-renderer');
    list.append(comment);
    const note = context.show(comment, { id: 'UCaaaaaaaaaaaaaaaaaaaaaa', name: 'Loud One' });
    assert.equal(list.children[0], note, 'the strip takes the comment\'s place');
    assert.equal(note.children[0].textContent, 'Comments from Loud One hidden');
    assert.equal(note.children[1].textContent, 'Undo');
    assert.equal(context.show(comment, { id: 'UCaaaaaaaaaaaaaaaaaaaaaa', name: 'Loud One' }), note, 'one strip per block');
    note.children[1].handlers.click();
    assert.deepEqual(JSON.parse(JSON.stringify(sent)), [{ type: 'undoCommentAuthorBlock', channelKey: 'UCaaaaaaaaaaaaaaaaaaaaaa' }]);
    assert.equal(list.children.includes(note), false, 'the strip goes once the block is undone');
});

test('the background undoes only its own recent content blocks, from the site, outside a Self-Control session', () => {
    const background = fs.readFileSync('js/background.js', 'utf8');
    const undo = sliceBetween(background, 'async function undoCommentAuthorBlock(', '/**\n * Handle adding a filtered channel');
    assert.match(background, /COMMENT_AUTHOR_UNDO_TTL_MS = 10 \* 60 \* 1000/);
    assert.match(undo, /isYouTubeContentSender\(sender\)/);
    assert.match(undo, /recentCommentAuthorBlocks\.get\(key\)/);
    assert.match(undo, /getActiveSelfControlSession\(\)/);
    assert.match(undo, /syncStoredMainKeywordsWithChannels/);
    assert.match(background, /rememberCommentAuthorBlock\(result, targetProfile\)/);
    const bridge = fs.readFileSync('js/content_bridge.js', 'utf8');
    assert.match(bridge, /if \(isCommentContextBlock && videoCard\) \{\n\s+try \{ showCommentAuthorHiddenNote\(resolveCommentHideTarget\(videoCard\), channelInfo\); \}/);
});
