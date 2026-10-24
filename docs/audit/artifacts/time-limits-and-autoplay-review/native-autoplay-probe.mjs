import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const tests = fs.readFileSync('tests/runtime/content-playback-native.test.mjs', 'utf8');
const fixtureCode = tests.slice(tests.indexOf('const code ='), tests.indexOf("test('native transaction creation"));
const fixture = new Function('fs', 'vm', 'assert', fixtureCode + '\nreturn fixture;')(fs, vm, assert);
for (const initialPaused of [true, false]) {
  const state = fixture({ paused: initialPaused, allowAutomaticStart: () => true });
  const input = state.input(); input.mode = 'automatic'; delete input.actionToken;
  const pending = state.controller.start(input);
  await state.video.play();
  const afterNativeStartAttempt = { paused: state.video.paused, calls: state.video.playCalls };
  state.ready(); state.ack(); state.stateReply();
  const result = await pending;
  assert.equal(result.status, 'active'); assert.equal(state.video.paused, initialPaused);
  console.log(JSON.stringify({ initialPaused, afterNativeStartAttempt, result,
    totalPlayCalls: state.video.playCalls, remainingGuards: state.document.count() }));
}
const explicitPause = fixture({ paused: true, allowAutomaticStart: () => true });
const input = explicitPause.input(); input.mode = 'automatic'; delete input.actionToken;
const pending = explicitPause.controller.start(input);
explicitPause.ready(); explicitPause.ack(); explicitPause.stateReply(); await pending;
assert.equal(explicitPause.video.paused, true); assert.equal(explicitPause.video.playCalls, 0);
console.log(JSON.stringify({ explicitPausedNoNewStartAttempt: 'preserved', playCalls: explicitPause.video.playCalls }));
