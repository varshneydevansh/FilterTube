// Regression: a collaboration with three or more channels lets the user tick several channels in the
// 3-dot menu and block them together with "Done • Block N Selected". Commit 03620e61 ("Clean mobile feed
// metadata and collaborator menus", shipped from v3.3.3) dropped isMultiStep and the setupMultiStepMenu
// call from renderFilterTubeMenuEntries, so the first tap on any channel row blocked it at once.
// These tests run the real menu code from js/content_bridge.js against a small fake DOM.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const bridge = fs.readFileSync(path.join(process.cwd(), 'js/content_bridge.js'), 'utf8');

function slice(start, end) {
    const from = bridge.indexOf(start);
    assert.notEqual(from, -1, `missing ${start}`);
    const to = bridge.indexOf(end, from + start.length);
    assert.notEqual(to, -1, `missing ${end}`);
    return bridge.slice(from, to);
}

// ---- A fake DOM just big enough for the menu rows -------------------------------------------------
function parseCompound(selector) {
    const parts = { classes: [], attrs: [], notAttrs: [] };
    const re = /\.([\w-]+)|:not\(\[([\w-]+)="([^"]*)"\]\)|\[([\w-]+)="([^"]*)"\]/g;
    let match;
    while ((match = re.exec(selector))) {
        if (match[1]) parts.classes.push(match[1]);
        else if (match[2]) parts.notAttrs.push([match[2], match[3]]);
        else parts.attrs.push([match[4], match[5]]);
    }
    return parts;
}

class FakeElement {
    constructor(className = '') {
        this.attributes = new Map();
        this.children = [];
        this.parent = null;
        this.listeners = {};
        this.style = {};
        this.textContent = '';
        this.isConnected = true;
        const classes = new Set(String(className).split(/\s+/).filter(Boolean));
        this.classList = {
            add: (...names) => names.forEach(name => classes.add(name)),
            remove: (...names) => names.forEach(name => classes.delete(name)),
            contains: name => classes.has(name),
            toggle: (name, force) => {
                const next = typeof force === 'boolean' ? force : !classes.has(name);
                if (next) classes.add(name); else classes.delete(name);
                return next;
            }
        };
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    removeAttribute(name) { this.attributes.delete(name); }
    appendChild(child) { child.parent = this; this.children.push(child); return child; }
    contains(node) { for (let n = node; n; n = n.parent) if (n === this) return true; return false; }
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
    blur() {}
    matches(selector) {
        const { classes, attrs, notAttrs } = parseCompound(selector);
        return classes.every(name => this.classList.contains(name))
            && attrs.every(([name, value]) => this.getAttribute(name) === value)
            && notAttrs.every(([name, value]) => this.getAttribute(name) !== value);
    }
    querySelectorAll(selector) {
        const found = [];
        const walk = node => node.children.forEach(child => { if (child.matches(selector)) found.push(child); walk(child); });
        walk(this);
        return found;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    async click(target = this) {
        const event = { target, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} };
        for (const handler of this.listeners.click || []) await handler(event);
    }
}

function loadMenuRuntime() {
    const calls = { blockClicks: [] };
    const frames = [];
    const context = {
        calls,
        console: { log() {}, warn() {}, error() {} },
        window: {},
        document: {},
        HTMLInputElement: class {},
        requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
        Map, Set, Array, String, Boolean, Math, JSON, Object, parseInt
    };
    context.globalThis = context;
    vm.createContext(context);
    const source = [
        slice('function filterTubeContentMenuText(', 'function isFilterTubeNativeOverlayQuietMode('),
        'const multiStepSelectionState = new Map();',
        slice('function getCollaboratorKey(', 'function applyBlockedVisualState('),
        slice('function attachFilterTubeMenuHandlers(', 'function createFilterTubeIconElement('),
        slice('function renderFilterTubeMenuEntries(', 'function updateInjectedMenuChannelName'),
        `
        function isCommentContextTag() { return false; }
        function findStoredChannelEntry() { return null; }
        function getMenuContainers(dropdown) { return { newMenuList: dropdown.menuList, oldMenuList: null }; }
        function clearFilterTubeMenuItems() {}
        function contentBridgeAmpersandTopicSingleChannelMenuGuard() { return null; }
        let groupCounter = 0;
        function generateCollaborationGroupId() { groupCounter += 1; return 'collab-test-' + groupCounter; }
        function injectStudySkipMenuItem() {}
        function forceDropdownResize() {}
        async function handleBlockChannelClick(channelInfo, menuItem) {
            const groupId = menuItem.getAttribute('data-collaboration-group-id');
            globalThis.calls.blockClicks.push({
                name: channelInfo.name,
                blockAll: menuItem.getAttribute('data-is-block-all') === 'true',
                doneButton: menuItem.getAttribute('data-is-done-button') === 'true',
                selected: Array.from(multiStepSelectionState.get(groupId)?.selected || []).sort()
            });
        }
        // Mirrors injectIntoNewMenu's attributes, then wires the real click handler.
        function injectIntoNewMenu(menuList, channelInfo, videoCard, collaborationMetadata = null, injectionOptions = {}) {
            const item = new FakeElement('filtertube-block-channel-item');
            const label = item.appendChild(new FakeElement('filtertube-menu-label'));
            label.textContent = 'Block';
            const name = item.appendChild(new FakeElement('filtertube-channel-name'));
            name.textContent = injectionOptions.displayName || channelInfo.name;
            const toggle = item.appendChild(new FakeElement('filtertube-filter-all-toggle'));
            if (collaborationMetadata?.isMultiStep || channelInfo.isMultiStep) item.setAttribute('data-multi-step', 'true');
            const groupId = collaborationMetadata?.collaborationGroupId || channelInfo.collaborationGroupId;
            if (groupId) item.setAttribute('data-collaboration-group-id', groupId);
            if (channelInfo.isBlockAllOption) item.setAttribute('data-is-block-all', 'true');
            const key = getCollaboratorKey(channelInfo);
            if (key && !channelInfo.isBlockAllOption) item.setAttribute('data-collab-key', key);
            attachFilterTubeMenuHandlers({ menuItem: item, toggle, channelInfo, videoCard, injectionOptions });
            menuList.appendChild(item);
            return item;
        }
        globalThis.renderFilterTubeMenuEntries = renderFilterTubeMenuEntries;
        globalThis.multiStepSelectionState = multiStepSelectionState;
        `
    ].join('\n');
    context.FakeElement = FakeElement;
    vm.runInContext(source, context);
    const flushFrames = () => { while (frames.length) frames.shift()(); };
    return { context, calls, flushFrames };
}

function collaborators(count) {
    return Array.from({ length: count }, (_, index) => ({
        name: `Creator ${index + 1}`,
        handle: `@creator${index + 1}`,
        id: `UC${String(index + 1).padStart(22, 'x')}`
    }));
}

function renderCollabMenu(count) {
    const runtime = loadMenuRuntime();
    const dropdown = new FakeElement('dropdown');
    dropdown.menuList = dropdown.appendChild(new FakeElement('menu-list'));
    runtime.context.renderFilterTubeMenuEntries({
        dropdown,
        channelInfo: { isCollaboration: true, allCollaborators: collaborators(count) },
        videoCard: { tagName: 'YTD-RICH-ITEM-RENDERER' }
    });
    runtime.flushFrames();
    const rows = dropdown.querySelectorAll('.filtertube-block-channel-item:not([data-is-block-all="true"])');
    const blockAll = dropdown.querySelector('.filtertube-block-channel-item[data-is-block-all="true"]');
    return { ...runtime, dropdown, rows, blockAll };
}

test('3+ collaborators: a row tap selects the channel and blocks nothing', async () => {
    const { rows, blockAll, calls } = renderCollabMenu(3);
    assert.equal(rows.length, 3);
    assert.ok(rows.every(row => row.getAttribute('data-multi-step') === 'true'));

    await rows[0].click();
    assert.deepEqual(calls.blockClicks, [], 'the first tap must not block the channel');
    assert.equal(rows[0].classList.contains('filtertube-collab-selected'), true);
    assert.equal(blockAll.querySelector('.filtertube-menu-label').textContent, 'Done');
    assert.equal(blockAll.querySelector('.filtertube-channel-name').textContent, 'Block 1 Selected');

    await rows[2].click();
    assert.equal(blockAll.querySelector('.filtertube-channel-name').textContent, 'Block 2 Selected');

    // A second tap on a row unticks it.
    await rows[2].click();
    assert.equal(rows[2].classList.contains('filtertube-collab-selected'), false);
    assert.equal(blockAll.querySelector('.filtertube-channel-name').textContent, 'Block 1 Selected');
    await rows[2].click();
    assert.deepEqual(calls.blockClicks, []);
});

test('3+ collaborators: only "Block N Selected" blocks, with exactly the ticked channels', async () => {
    const { rows, blockAll, calls } = renderCollabMenu(4);
    await rows[1].click();
    await rows[3].click();
    await blockAll.click();
    assert.equal(calls.blockClicks.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(calls.blockClicks[0])), {
        name: 'All 4 Collaborators',
        blockAll: true,
        doneButton: true,
        selected: ['ucxxxxxxxxxxxxxxxxxxxxx2', 'ucxxxxxxxxxxxxxxxxxxxxx4']
    });
});

test('3+ collaborators: with nothing ticked, the group row is still "Block all"', async () => {
    const { rows, blockAll, calls } = renderCollabMenu(3);
    assert.equal(blockAll.querySelector('.filtertube-channel-name').textContent, 'All 3 Collaborators');
    await rows[0].click();
    await rows[0].click(); // untick again
    assert.equal(blockAll.getAttribute('data-is-done-button'), null);
    await blockAll.click();
    assert.equal(calls.blockClicks.length, 1);
    assert.equal(calls.blockClicks[0].blockAll, true);
    assert.equal(calls.blockClicks[0].doneButton, false);
});

test('an already blocked collaborator is not counted as a new pick', async () => {
    const runtime = loadMenuRuntime();
    const dropdown = new FakeElement('dropdown');
    dropdown.menuList = dropdown.appendChild(new FakeElement('menu-list'));
    runtime.context.renderFilterTubeMenuEntries({
        dropdown,
        channelInfo: { isCollaboration: true, allCollaborators: collaborators(3) },
        videoCard: null
    });
    const rows = dropdown.querySelectorAll('.filtertube-block-channel-item:not([data-is-block-all="true"])');
    rows[0].classList.add('filtertube-blocked'); // checkIfChannelBlocked marks it before the frame
    runtime.flushFrames();
    const blockAll = dropdown.querySelector('.filtertube-block-channel-item[data-is-block-all="true"]');
    assert.equal(blockAll.querySelector('.filtertube-channel-name').textContent, 'All 3 Collaborators');
    assert.equal(blockAll.getAttribute('data-is-done-button'), null);
});

test('2 collaborators keep one-tap rows (the design before the regression)', async () => {
    const { rows, blockAll, calls } = renderCollabMenu(2);
    assert.ok(rows.every(row => row.getAttribute('data-multi-step') === null));
    await rows[0].click();
    assert.equal(calls.blockClicks.length, 1);
    assert.equal(calls.blockClicks[0].name, 'Creator 1');
    await blockAll.click();
    assert.equal(calls.blockClicks[1].name, 'Both Channels');
    assert.equal(calls.blockClicks[1].doneButton, false);
});

test('the menu render wires multi-select for 3+ collaborators in both menu shapes', () => {
    const render = slice('function renderFilterTubeMenuEntries(', 'function updateInjectedMenuChannelName');
    assert.match(render, /const isMultiStep = collaboratorCount >= 3;/);
    assert.equal((render.match(/setupMultiStepMenu\(dropdown, groupId, collaborators\.slice\(0, collaboratorCount\), blockAllMenuItem\)/g) || []).length, 2);
    assert.equal((render.match(/^\s+isMultiStep$/gm) || []).length, 4);
});
