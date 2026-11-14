import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Study = require('../../js/shared/study_model.js');

const sample = () => ({
  version: 1,
  packIds: ['in_upsc_cse'],
  edits: { in_upsc_cse: { addChannels: [{ channelId: 'UCV1lbzgZNcYFAT3VHKOb7Cg', handle: '@UnacademyUPSC101' }], removeChannels: ['@SansadTV'], addTopics: ['Indian  Polity'], removeTopics: [] } },
  focus: { roundMinutes: 40, breakMinutes: 10, dailyGoalMinutes: 120 },
  plan: { days: [1, 2, 3, 4, 5], start: '16:00', end: '18:00', setBy: { kind: 'parent', profileId: 'mum', name: 'Mum' } },
  lock: { ref: 'session-1', mode: 'locked', setBy: 'self' },
  savedListMode: 'blocklist',
  progress: { phone: { '2026-11-14': 50, '2026-11-15': 20 } },
  weekView: true
});

test('a study object normalizes to the version 1 shape', () => {
  const study = Study.normalizeStudy(sample());
  assert.deepEqual(Object.keys(study).sort(), ['edits', 'focus', 'lock', 'packIds', 'plan', 'progress', 'savedListMode', 'version', 'weekView']);
  assert.equal(study.version, 1);
  assert.deepEqual(study.edits.in_upsc_cse.addTopics, ['indian polity']);
  assert.deepEqual(study.plan.days, [1, 2, 3, 4, 5]);
  assert.equal(study.lock.mode, 'locked');
  assert.equal(Study.normalizeStudy(null), null);
  assert.equal(Study.normalizeStudy([]), null);
});

test('invalid fields fall back without dropping the rest', () => {
  const study = Study.normalizeStudy({
    packIds: ['ok_pack', 'ok_pack', '', 'bad id', 7],
    focus: { roundMinutes: 1, breakMinutes: 'x', dailyGoalMinutes: 90 },
    plan: { days: ['Mon', 'fri', 9], start: '25:00', end: '18:00' },
    lock: { mode: 'locked' },
    savedListMode: 'other',
    progress: { phone: { '2026-02-30': 5, '2026-11-15': -1, '2026-11-14': 30 }, __proto__: { x: 1 } }
  });
  assert.deepEqual(study.packIds, ['ok_pack']);
  assert.deepEqual(study.focus, { roundMinutes: 25, breakMinutes: 5, dailyGoalMinutes: 90 });
  assert.equal(study.plan, null, 'a plan without a valid time range is dropped');
  assert.equal(study.lock, null, 'a lock needs its reference');
  assert.equal(study.savedListMode, null);
  assert.deepEqual(study.progress, { phone: { '2026-11-14': 30 } });
  assert.equal(study.weekView, false);
});

test('fields a newer app wrote survive normalization and merge', () => {
  const study = Study.normalizeStudy({ ...sample(), futureField: { a: 1 } });
  assert.deepEqual(study.futureField, { a: 1 });
  assert.deepEqual(Study.mergeStudy(sample(), study).futureField, { a: 1 });
});

test('packs and edits merge like keywords', () => {
  const local = sample();
  const incoming = {
    version: 1,
    packIds: ['in_upsc_cse', 'in_ssc'],
    edits: {
      in_upsc_cse: { addChannels: ['@SansadTV', { handle: '@unacademyupsc101', name: 'Unacademy' }], removeChannels: [], addTopics: ['indian polity', 'ethics'], removeTopics: [] },
      in_ssc: { addChannels: [], removeChannels: [], addTopics: ['reasoning'], removeTopics: [] }
    }
  };
  const merged = Study.mergeStudy(local, incoming);
  assert.deepEqual(merged.packIds, ['in_upsc_cse', 'in_ssc']);
  const upsc = merged.edits.in_upsc_cse;
  assert.deepEqual(upsc.addTopics, ['indian polity', 'ethics']);
  assert.deepEqual(upsc.removeChannels, [], 'an incoming add of a channel this device removed wins');
  assert.equal(upsc.addChannels.length, 3, 'the channel id row and the handle row differ in identity');
  assert.deepEqual(merged.edits.in_ssc.addTopics, ['reasoning']);
});

test('channel identity prefers the channel id, then the handle', () => {
  assert.equal(Study.channelIdentity({ channelId: 'UCV1lbzgZNcYFAT3VHKOb7Cg', handle: '@x' }), 'id:UCV1lbzgZNcYFAT3VHKOb7Cg');
  assert.equal(Study.channelIdentity({ handle: '@StudyIQ' }), Study.channelIdentity('@studyiq'));
  assert.equal(Study.channelIdentity('UCV1lbzgZNcYFAT3VHKOb7Cg'), 'id:UCV1lbzgZNcYFAT3VHKOb7Cg');
});

test('progress takes the larger value per device and per day, never the sum', () => {
  const merged = Study.mergeProgress(
    { phone: { '2026-11-14': 50, '2026-11-15': 20 }, tv: { '2026-11-15': 5 } },
    { phone: { '2026-11-14': 40, '2026-11-15': 30 }, laptop: { '2026-11-15': 15 } }
  );
  assert.deepEqual(merged, { phone: { '2026-11-14': 50, '2026-11-15': 30 }, tv: { '2026-11-15': 5 }, laptop: { '2026-11-15': 15 } });
  // Merging the same data again changes nothing.
  assert.deepEqual(Study.mergeProgress(merged, merged), merged);
});

test('a running lock is never copied, by merge or by replace', () => {
  const incoming = { ...sample(), lock: { ref: 'other-device-session', mode: 'locked', setBy: 'self' } };
  assert.equal(Study.mergeStudy(null, incoming).lock, null);
  assert.equal(Study.mergeStudy(null, incoming, { strategy: 'replace' }).lock, null);
  const local = { ...sample(), lock: null };
  assert.equal(Study.mergeStudy(local, incoming).lock, null);
  assert.equal(Study.mergeStudy(local, incoming, { strategy: 'replace' }).lock, null);
  const running = sample();
  assert.equal(Study.mergeStudy(running, { ...incoming, lock: null }, { strategy: 'replace' }).lock.ref, 'session-1',
    'replacing rules does not end the lock running here');
  assert.equal(Study.withoutLock(running).lock, null);
});

test('replace takes the incoming plan and packs but keeps this device\'s own progress', () => {
  const merged = Study.mergeStudy(sample(), { version: 1, packIds: ['gb_gcse'], progress: { laptop: { '2026-11-15': 9 } } }, { strategy: 'replace' });
  assert.deepEqual(merged.packIds, ['gb_gcse']);
  assert.equal(merged.plan, null);
  assert.deepEqual(merged.progress, { phone: { '2026-11-14': 50, '2026-11-15': 20 }, laptop: { '2026-11-15': 9 } });
  assert.equal(merged.savedListMode, 'blocklist', 'the mode to return to belongs to this device');
});

test('merge: explicit incoming settings win, missing ones keep local', () => {
  const merged = Study.mergeStudy(sample(), { version: 1, packIds: [], focus: { roundMinutes: 50 }, weekView: false });
  assert.deepEqual(merged.focus, { roundMinutes: 50, breakMinutes: 10, dailyGoalMinutes: 120 });
  assert.equal(merged.weekView, false);
  assert.equal(Study.mergeStudy(sample(), { version: 1, packIds: [] }).weekView, true);
  assert.equal(Study.mergeStudy(sample(), { version: 1, packIds: [] }).plan.start, '16:00');
});

test('pack ids are rebuilt from study:<packId> tags when the study object is missing', () => {
  const profile = { main: {
    whitelistChannels: [{ id: 'UC1', managedListId: 'study:in_upsc_cse' }, { id: 'UC2', managedListId: 'list:other' }, { id: 'UC3', managedListId: 'study:in_ssc' }],
    whitelistKeywords: [{ word: 'polity', managedListId: 'study:in_upsc_cse' }]
  }, kids: { whitelistChannels: [{ id: 'UC4', managedListId: 'STUDY:gb_gcse' }] } };
  assert.deepEqual(Study.packIdsFromTags(profile), ['in_upsc_cse', 'in_ssc', 'gb_gcse']);
  const rebuilt = Study.withProfileStudy(profile).study;
  assert.deepEqual(rebuilt.packIds, ['in_upsc_cse', 'in_ssc', 'gb_gcse']);
  assert.equal(rebuilt.version, 1);
  // A stored object wins over the tags; a profile with neither stays without one.
  assert.deepEqual(Study.withProfileStudy({ ...profile, study: { version: 1, packIds: ['x_pack'] } }).study.packIds, ['x_pack']);
  assert.equal(Object.hasOwn(Study.withProfileStudy({ main: {} }), 'study'), false);
});

test('managed study scopes need the child capability and ride the time grant', () => {
  assert.equal(Study.linkSupportsStudy({ capabilities: ['sync.receive', 'control.apply'] }), false);
  assert.equal(Study.linkSupportsStudy({ policy: { capabilities: ['study.v1'] } }), true);
  assert.equal(Study.managedScopeAllowed('study', ['main', 'kids']), false);
  assert.equal(Study.managedScopeAllowed('schedule', ['main', 'time_limits']), true);
  assert.equal(Study.managedScopeAllowed('focus_lock', ['focus_lock']), true);
  assert.equal(Study.managedScopeAllowed('time_limits', ['time_limits']), false);
});

test('managed payloads round-trip and only the parent that locked can unlock', () => {
  const source = { sourceProfileId: 'mum', sourceDeviceId: 'mum-phone', sourceProfileName: 'Mum' };
  const parentStudy = sample();
  let child = Study.createStudy({ progress: { tablet: { '2026-11-15': 12 } }, savedListMode: 'blocklist' });
  for (const scope of Study.MANAGED_SCOPES) {
    const payload = Study.buildManagedPayload(scope, parentStudy);
    assert.equal(Study.validateManagedPayload(scope, payload), '');
    child = Study.applyManagedPayload(child, scope, payload, source);
  }
  assert.deepEqual(child.packIds, ['in_upsc_cse']);
  assert.deepEqual(child.focus, parentStudy.focus);
  assert.equal(child.plan.setBy.profileId, 'mum');
  assert.equal(child.lock.mode, 'locked');
  assert.deepEqual(child.lock.setBy, { kind: 'parent', profileId: 'mum', deviceId: 'mum-phone', name: 'Mum' });
  assert.deepEqual(child.progress, { tablet: { '2026-11-15': 12 } }, 'the child keeps its own progress');
  assert.throws(() => Study.applyManagedPayload(child, 'focus_lock', { scope: 'focus_lock', lock: null }, { sourceProfileId: 'dad' }),
    /focus_lock_owned_by_another_parent/);
  assert.equal(Study.applyManagedPayload(child, 'focus_lock', { scope: 'focus_lock', lock: null }, source).lock, null);
  assert.equal(Study.validateManagedPayload('schedule', { scope: 'schedule' }), 'invalid_schedule_payload');
  assert.equal(Study.validateManagedPayload('study', { scope: 'schedule', packIds: [] }), 'payload_scope_mismatch');
});

test('a self-started lock can be replaced by a parent lock', () => {
  const child = Study.createStudy({ lock: { ref: 'self-1', mode: 'locked', setBy: 'self' } });
  const next = Study.applyManagedPayload(child, 'focus_lock', { scope: 'focus_lock', lock: { ref: 'exam-week', mode: 'locked' } }, { sourceProfileId: 'mum' });
  assert.equal(next.lock.ref, 'exam-week');
});

test('the personal sync value never carries the lock', () => {
  const value = Study.validateForSync(sample());
  assert.equal(value.lock, null);
  assert.throws(() => Study.validateForSync({ version: 1 }), /invalid_personal_sync/);
});
