// Live chat under the full rules, ported from the Android app's NativeMainLiveChatFilterRulesTest:
// the profile's channels and keywords decide each message the way they decide cards.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
function loadIdentity() {
    const context = { window: { FilterTubeIdentity: {} }, URL, JSON, decodeURIComponent, console };
    context.self = context.window;
    context.globalThis = context.window;
    vm.runInNewContext(fs.readFileSync('js/shared/identity.js', 'utf8'), context, { filename: 'js/shared/identity.js' });
    return context.window.FilterTubeIdentity;
}
const Identity = loadIdentity();
const Chat = require('../../js/shared/live_chat_filter.js');

const blockedId = 'UCaaaaaaaaaaaaaaaaaaaaaa';
const allowedId = 'UCbbbbbbbbbbbbbbbbbbbbbb';
const otherId = 'UCcccccccccccccccccccccc';
const messages = [
    { id: 'blocked-sender', author: 'Spammer', authorChannelId: blockedId, text: 'hello all' },
    { id: 'keyword', author: 'Viewer', authorChannelId: otherId, text: 'big Spoiler ahead' },
    { id: 'allowed-sender', author: 'Friend', authorChannelId: allowedId, text: 'hi' },
    { id: 'plain', author: 'Viewer', authorChannelId: otherId, text: 'nice stream' }
];
const word = value => ({ pattern: value, flags: 'i' });
const settings = (extra = {}) => ({ enabled: true, listMode: 'blocklist', channelMap: {}, filterChannels: [], filterKeywords: [],
    filterKeywordsComments: [], whitelistChannels: [], whitelistKeywords: [], ...extra });
const visible = (rules, list = messages) => Chat.apply(list, Chat.compile(rules, Identity)).messages.map(message => message.id);

test('a blocked channel\'s message is hidden wherever the channel was blocked', () => {
    assert.deepEqual(visible(settings({ filterChannels: [{ name: 'Spammer', id: blockedId }] })), ['keyword', 'allowed-sender', 'plain']);
    assert.deepEqual(visible(settings({ filterChannels: [{ name: 'Spammer', id: blockedId, source: 'comments', filterAllComments: true }] })),
        ['keyword', 'allowed-sender', 'plain'], 'blocked from a comment hides it in chat too');
});

test('a handle rule matches the sender\'s shown handle', () => {
    const chat = [
        { id: 'loud', author: '@LoudOne', authorChannelId: otherId, text: 'hey' },
        { id: 'quiet', author: '@quiet', authorChannelId: allowedId, text: 'hey' }
    ];
    assert.deepEqual(visible(settings({ filterChannels: [{ name: '@loudone', id: '@loudone', handle: '@loudone' }] }), chat), ['quiet']);
});

test('any keyword in the text hides the message, not only comment keywords', () => {
    const rules = settings({ filterKeywords: [word('spoiler')] });
    assert.deepEqual(visible(rules), ['blocked-sender', 'allowed-sender', 'plain']);
    assert.equal(Chat.apply(messages, Chat.compile(rules, Identity)).hidden, 1);
    assert.deepEqual(visible(settings({ filterKeywordsComments: [word('spoiler')] })), ['blocked-sender', 'allowed-sender', 'plain'],
        'a comment-only keyword hides chat as well');
    assert.deepEqual(visible(settings({ filterKeywords: [{ ...word('spoiler'), dateFilter: { enabled: true } }] })), messages.map(m => m.id),
        'a date-limited word describes videos and never decides a message');
});

test('allow mode shows only allowed senders or allowed words; an empty allow list shows nothing', () => {
    const rules = settings({ listMode: 'whitelist', whitelistChannels: [{ name: 'Friend', id: allowedId }], whitelistKeywords: [word('spoiler')] });
    assert.deepEqual(visible(rules), ['keyword', 'allowed-sender']);
    assert.deepEqual(visible(settings({ listMode: 'whitelist' })), []);
});

test('a sender without a channel id stays hidden while channel rules exist', () => {
    const chat = [{ id: 'anon', author: 'Someone', text: 'hi' }];
    assert.equal(Chat.apply(chat, Chat.compile(settings({ filterChannels: [{ name: 'Spammer', id: blockedId }] }), Identity)).hidden, 1);
    assert.equal(Chat.apply(chat, Chat.compile(settings(), Identity)).hidden, 0);
});

test('filtering off shows everything; a study break hides everything', () => {
    assert.equal(Chat.compile(settings({ enabled: false, filterKeywords: [word('spoiler')] }), Identity), null);
    assert.deepEqual(visible(settings({ enabled: false, filterKeywords: [word('spoiler')] })), messages.map(m => m.id));
    assert.deepEqual(visible(settings({ study: { state: 'BREAK' } })), []);
});

test('layered rules: a blocked word subtracts from an allowed sender', () => {
    const rules = settings({ listMode: 'whitelist', listLayered: true, whitelistChannels: [{ name: 'Friend', id: allowedId }], filterKeywords: [word('hi')] });
    assert.deepEqual(visible(rules), []);
});

test('the live chat frame gets the filter in every browser, with the page\'s sender id read in the main world', () => {
    for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json', 'manifest.firefox.json']) {
        const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        const chat = manifest.content_scripts.filter(entry => entry.matches.includes('*://*.youtube.com/live_chat*'));
        assert.equal(chat.length, 2, file);
        assert.ok(chat.every(entry => entry.all_frames === true), file);
        assert.deepEqual(chat.find(entry => entry.world === 'MAIN').js, ['js/content/live_chat_identity.js'], file);
        assert.deepEqual(chat.find(entry => entry.world !== 'MAIN').js, ['js/shared/identity.js', 'js/shared/live_chat_filter.js', 'js/content/live_chat_filter.js'], file);
    }
    const identity = fs.readFileSync('js/content/live_chat_identity.js', 'utf8');
    assert.match(identity, /authorExternalChannelId/);
    assert.doesNotMatch(identity, /sendMessage|fetch\(|postMessage/, 'it reads the page and sends nothing');
});
