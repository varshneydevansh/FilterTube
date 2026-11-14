import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// profile.study version 1, the same shape and merge rules as Android (StudyModels.kt, StudyMerge.kt).
const require = createRequire(import.meta.url);
const Study = require('../../js/shared/study_model.js');

const KEYS = ['activePackIds', 'breakMode', 'focus', 'lock', 'packEdits', 'plan', 'progress', 'savedListMode', 'version', 'weekView'];
const study = (extra = {}) => ({ version: 1, activePackIds: [], packEdits: {}, focus: { roundMinutes: 25, breakMinutes: 5, dailyGoalMinutes: 120 },
  plan: null, lock: null, savedListMode: null, breakMode: 'rest', progress: {}, weekView: null, ...extra });
const localStudy = () => study({
  activePackIds: ['in_upsc_cse'],
  packEdits: { in_upsc_cse: { channelsAdded: [{ handle: '@Mine' }], channelsRemoved: [], topicsAdded: ['Polity'], topicsRemoved: [] } },
  lock: { sessionId: 'local-session', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null },
  savedListMode: 'blocklist',
  progress: { phone: { '2026-11-14': 30, '2026-11-15': 10 } }
});
const remoteStudy = () => study({
  activePackIds: ['in_upsc_cse', 'in_ssc'],
  packEdits: { in_upsc_cse: { channelsAdded: [{ handle: '@mine' }, { channelId: 'UCV1lbzgZNcYFAT3VHKOb7Cg' }], channelsRemoved: ['@Vlogs'], topicsAdded: ['polity '], topicsRemoved: ['vlog'] } },
  lock: { sessionId: 'remote-session', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null },
  savedListMode: 'layered',
  focus: { roundMinutes: 50, breakMinutes: 10, dailyGoalMinutes: 180 },
  progress: { phone: { '2026-11-15': 5 }, tablet: { '2026-11-15': 40 } }
});

test('every key is always written and null means unset', () => {
  const value = Study.normalizeStudy({});
  assert.deepEqual(Object.keys(value).sort(), KEYS);
  assert.deepEqual(value, study());
  assert.equal(Study.normalizeStudy(null), null);
  assert.equal(Study.normalizeStudy([]), null);
});

test('values are clamped and invalid rows dropped the way Android reads them', () => {
  const value = Study.normalizeStudy({
    version: 0,
    activePackIds: ['in_upsc_cse', 'in_upsc_cse', ' in_ssc ', 'bad id', 7],
    packEdits: { in_ssc: { channelsAdded: [{ name: 'no id or handle' }, { handle: '@A' }, { handle: '@a' }], channelsRemoved: ['@x', '@X'], topicsAdded: ['Polity', ' polity'] }, 'bad id': {} },
    focus: { roundMinutes: 1, breakMinutes: 500, dailyGoalMinutes: 99.9 },
    plan: { days: ['Fri', 'mon', 'xyz'], start: '16:00', end: '18:00' },
    lock: { sessionId: 's1', sessionKind: 'other', mode: 'weird' },
    savedListMode: 'Layered', breakMode: 'party',
    progress: { ' phone ': { '2026-11-15': 2000, '2026-11-14': -5, 'bad': 3, '2026-11-13': 'x' } },
    weekView: 'yes'
  });
  assert.deepEqual(value.activePackIds, ['in_upsc_cse', 'in_ssc']);
  assert.deepEqual(Object.keys(value.packEdits), ['in_ssc']);
  assert.deepEqual(value.packEdits.in_ssc, { channelsAdded: [{ handle: '@A' }], channelsRemoved: ['@x'], topicsAdded: ['Polity'], topicsRemoved: [] });
  assert.deepEqual(value.focus, { roundMinutes: 5, breakMinutes: 120, dailyGoalMinutes: 99 });
  assert.deepEqual(value.plan, { days: ['mon', 'fri'], start: '16:00', end: '18:00', setByParentId: null });
  assert.deepEqual(value.lock, { sessionId: 's1', sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: null });
  assert.equal(value.savedListMode, 'layered');
  assert.equal(value.breakMode, 'rest');
  assert.deepEqual(value.progress, { phone: { '2026-11-14': 0, '2026-11-15': 1440 } });
  assert.equal(value.weekView, null);
  assert.equal(Study.normalizeStudy({ plan: { start: '25:00', end: '18:00' } }).plan, null);
});

test('fields a newer app wrote survive on every object', () => {
  const value = Study.normalizeStudy(study({ futureField: { a: 1 }, focus: { roundMinutes: 30, extra: true },
    packEdits: { p1: { channelsAdded: [{ handle: '@a', note: 'x' }], future: 1 } } }));
  assert.deepEqual(value.futureField, { a: 1 });
  assert.equal(value.focus.extra, true);
  assert.equal(value.packEdits.p1.future, 1);
  assert.equal(value.packEdits.p1.channelsAdded[0].note, 'x');
  assert.deepEqual(Study.mergeStudy(value, study()).futureField, { a: 1 });
});

test('Merge unions packs and edits, takes the larger progress and keeps this device\'s lock', () => {
  const result = Study.mergeStudy(localStudy(), remoteStudy());
  assert.deepEqual(result.activePackIds, ['in_upsc_cse', 'in_ssc']);
  const edits = result.packEdits.in_upsc_cse;
  assert.equal(edits.channelsAdded.length, 2, 'the same handle in another case is one channel');
  assert.deepEqual(edits.channelsRemoved, ['@Vlogs']);
  assert.equal(edits.topicsAdded.length, 1, 'the same topic with other spacing or case is one topic');
  assert.deepEqual(edits.topicsRemoved, ['vlog']);
  assert.deepEqual(result.progress, { phone: { '2026-11-14': 30, '2026-11-15': 10 }, tablet: { '2026-11-15': 40 } });
  assert.equal(result.lock.sessionId, 'local-session');
  assert.equal(result.savedListMode, 'blocklist', 'the rules to return to stay this device\'s');
  assert.deepEqual(result.focus, { roundMinutes: 50, breakMinutes: 10, dailyGoalMinutes: 180 });
  assert.deepEqual(Study.mergeProgress(result.progress, result.progress), result.progress, 'merging again changes nothing');
});

test('Replace takes the incoming packs and edits but progress never goes down and the lock stays', () => {
  const result = Study.mergeStudy(localStudy(), remoteStudy(), { strategy: 'replace' });
  assert.deepEqual(result.activePackIds, ['in_upsc_cse', 'in_ssc']);
  assert.deepEqual(result.packEdits.in_upsc_cse.channelsRemoved, ['@Vlogs']);
  assert.equal(result.packEdits.in_upsc_cse.topicsAdded[0], 'polity');
  assert.equal(result.progress.phone['2026-11-14'], 30);
  assert.equal(result.lock.sessionId, 'local-session');
});

test('a device new to study gets no lock; Move account (carryLock) brings it', () => {
  assert.equal(Study.mergeStudy(null, remoteStudy()).lock, null);
  assert.equal(Study.mergeStudy(null, remoteStudy(), { carryLock: true }).lock.sessionId, 'remote-session');
  const moved = Study.mergeStudy(localStudy(), remoteStudy(), { strategy: 'replace', carryLock: true });
  assert.equal(moved.lock.sessionId, 'remote-session');
  assert.equal(moved.savedListMode, 'layered');
  assert.equal(moved.progress.phone['2026-11-14'], 30, 'progress still never goes down');
  assert.deepEqual(Study.mergeStudy(localStudy(), null), localStudy());
});

test('a plan and break mode a parent set here stay; the profile\'s own plan follows the other device', () => {
  const parentPlan = { days: ['mon'], start: '16:00', end: '18:00', setByParentId: 'mum' };
  const local = study({ plan: parentPlan, breakMode: 'normal' });
  const incoming = study({ plan: { days: ['sat'], start: '09:00', end: '10:00', setByParentId: null }, breakMode: 'rest' });
  const kept = Study.mergeStudy(local, incoming);
  assert.deepEqual(kept.plan, parentPlan);
  assert.equal(kept.breakMode, 'normal');
  assert.equal(Study.mergeStudy(local, incoming, { strategy: 'replace' }).plan.setByParentId, 'mum');
  assert.equal(Study.mergeStudy(local, incoming, { carryLock: true }).plan.days[0], 'sat', 'Move account carries everything');
  const own = study({ plan: { days: ['mon'], start: '16:00', end: '18:00', setByParentId: null } });
  assert.deepEqual(Study.mergeStudy(own, incoming).plan.days, ['sat']);
  assert.deepEqual(Study.mergeStudy(own, study()).plan.days, ['mon'], 'Merge keeps a local plan the other device lacks');
  assert.equal(Study.mergeStudy(own, study(), { strategy: 'replace' }).plan, null);
});

test('weekView: an explicit value wins, null keeps local; null means the profile-type default', () => {
  assert.equal(Study.mergeStudy(study({ weekView: false }), study()).weekView, false);
  assert.equal(Study.mergeStudy(study({ weekView: false }), study({ weekView: true })).weekView, true);
  assert.equal(Study.weekViewEnabled(study(), 'account'), true);
  assert.equal(Study.weekViewEnabled(study(), 'child'), false);
  assert.equal(Study.weekViewEnabled(study({ weekView: true }), 'child'), true);
});

test('the active packs are rebuilt from study:<packId> tags without writing study back', () => {
  const profile = { main: {
    whitelistChannels: [{ id: 'UC1', managedListId: 'study:in_upsc_cse' }, { id: 'UC2', managedListId: 'list:other' }, { id: 'UC3', managedListId: 'study:in_ssc' }],
    whitelistKeywords: [{ word: 'polity', managedListId: 'study:in_upsc_cse' }]
  }, kids: { whitelistChannels: [{ id: 'UC4', managedListId: 'study:gb_gcse' }, { id: 'UC5', managedListId: 'STUDY:ignored' }] } };
  assert.deepEqual(Study.packIdsFromTags(profile), ['in_upsc_cse', 'in_ssc', 'gb_gcse']);
  assert.deepEqual(Study.profileStudy(profile), study({ activePackIds: ['in_upsc_cse', 'in_ssc', 'gb_gcse'] }));
  assert.equal(Object.hasOwn(profile, 'study'), false);
  assert.deepEqual(Study.profileStudy({ ...profile, study: study({ activePackIds: ['x_pack'] }) }).activePackIds, ['x_pack']);
  assert.equal(Study.profileStudy({ main: {} }), null);
});

test('layered rules: the block list always applies and the allow list is an optional layer', () => {
  const blockOnly = Study.ruleLayers({ mode: 'blocklist', keywords: [{ word: 'drama' }], whitelistChannels: [{ id: 'UC2' }] });
  assert.equal(blockOnly.layering, 'blocklist');
  assert.equal(blockOnly.effective.allow.channels.length, 0, 'allow rows stay stored but off');
  const layered = Study.ruleLayers({ mode: 'whitelist', layered: true, keywords: [{ word: 'drama' }], whitelistChannels: [{ id: 'UC2' }] });
  assert.equal(layered.layering, 'layered');
  assert.deepEqual(layered.effective.block.keywords, [{ word: 'drama' }], 'allow Apex channels and still block "drama"');
  // Whitelist data saved before 3.6.2 keeps its meaning: allow list on, block list ignored, nothing deleted.
  const legacy = Study.ruleLayers({ mode: 'whitelist', keywords: [{ word: 'drama' }] });
  assert.equal(legacy.layering, 'whitelist');
  assert.deepEqual(legacy.effective.block.keywords, []);
  assert.deepEqual(legacy.stored.block.keywords, [{ word: 'drama' }]);
  assert.deepEqual(Study.ruleLayers({ mode: 'blocklist', blockedChannels: [{ id: 'UCk' }] }, { surface: 'kids' }).effective.block.channels, [{ id: 'UCk' }]);
  // layered is written only when on, next to the mode every app already reads.
  assert.deepEqual(Study.withRuleLayering({ mode: 'blocklist', channels: [] }, 'layered'), { mode: 'whitelist', channels: [], layered: true });
  assert.deepEqual(Study.withRuleLayering({ mode: 'whitelist', layered: true }, 'whitelist'), { mode: 'whitelist' });
  assert.deepEqual(Study.withRuleLayering({ mode: 'whitelist', layered: true }, 'blocklist'), { mode: 'blocklist' });
});

test('the personal sync value never carries the lock', () => {
  assert.equal(Study.validateForSync(localStudy()).lock, null);
  assert.equal(Study.validateForSync(null), null);
  assert.throws(() => Study.validateForSync({ version: 1 }), /invalid_personal_sync/);
});
