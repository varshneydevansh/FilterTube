import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

function fixture({ connectError = '', pendingConnection = false } = {}) {
  let timeoutCallback;
  let timersCleared = 0;
  const window = {
    setTimeout(callback) { timeoutCallback = callback; return 1; },
    clearTimeout() { timersCleared += 1; }
  };
  vm.runInNewContext(fs.readFileSync(new URL('../../js/nanah_sync_adapter.js', import.meta.url), 'utf8'), { window });
  const listeners = new Map();
  let releaseConnection;
  const socket = {
    closed: 0,
    close() { this.closed += 1; },
    addEventListener(type, listener) { const set = listeners.get(type) || new Set(); set.add(listener); listeners.set(type, set); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    emit(type, value) { for (const listener of listeners.get(type) || []) listener(value); }
  };
  const codes = new Set();
  const client = {
    calls: 0, closed: 0,
    transport: { async connectSocket() {
      if (connectError) throw new Error(connectError);
      if (pendingConnection) await new Promise(resolve => { releaseConnection = resolve; });
      return socket;
    } },
    on(type, listener) { assert.equal(type, 'code'); codes.add(listener); return () => codes.delete(listener); },
    async host() {
      this.calls += 1;
      const result = { code: 'ABCD', sessionId: 'session-1' };
      for (const listener of codes) listener(result);
      await this.transport.connectSocket();
      return result;
    },
    async close() { this.closed += 1; }
  };
  const originalConnect = client.transport.connectSocket;
  return {
    client, originalConnect,
    host: options => window.FilterTubeNanahAdapter.hostSessionWhenReady(client, options),
    expire: () => timeoutCallback(),
    message: value => socket.emit('message', { data: JSON.stringify(value) }),
    close: () => socket.emit('close', {}),
    releaseConnection: () => releaseConnection(),
    socket,
    cleanup() {
      assert.equal(client.transport.connectSocket, originalConnect);
      assert.equal(codes.size, 0);
      assert.equal(Array.from(listeners.values()).reduce((sum, set) => sum + set.size, 0), 0);
      assert.equal(timersCleared, 1);
    }
  };
}

async function flush() { for (let index = 0; index < 5; index += 1) await Promise.resolve(); }

test('hosting returns the shareable code only after the matching relay registration acknowledgment', async () => {
  const f = fixture();
  let completed = false;
  const task = f.host().then(result => { completed = true; return result; });
  await flush();
  assert.equal(f.client.calls, 1);
  assert.equal(completed, false, 'client.host completion and early code event are insufficient');
  f.message({ type: 'session_ready', code: 'WXYZ', sessionId: 'session-1' });
  f.message({ type: 'session_ready', code: 'ABCD', sessionId: 'other-session' });
  await flush();
  assert.equal(completed, false, 'a different session cannot release this code');
  f.message({ type: 'session_ready', code: 'ABCD', sessionId: 'session-1' });
  assert.equal((await task).code, 'ABCD');
  assert.equal(f.client.closed, 0);
  f.cleanup();
});

test('relay registration failure closes the provisional session instead of publishing a code', async () => {
  const f = fixture();
  const task = f.host();
  const rejected = assert.rejects(task, /session_occupied/);
  await flush();
  f.message({ type: 'error', error: 'session_occupied' });
  await rejected;
  assert.equal(f.client.closed, 1);
  f.cleanup();
});

test('relay registration timeout is bounded and closes the provisional session', async () => {
  const f = fixture();
  const task = f.host();
  const rejected = assert.rejects(task, /nanah_host_registration_timeout/);
  await flush();
  f.expire();
  await rejected;
  assert.equal(f.client.closed, 1);
  f.cleanup();
});

test('socket closure before relay registration cannot produce a shareable code', async () => {
  const f = fixture();
  const rejected = assert.rejects(f.host(), /nanah_host_registration_closed/);
  await flush();
  f.close();
  await rejected;
  f.cleanup();
});

test('connection failure restores transport methods and rejects without waiting for registration', async () => {
  const f = fixture({ connectError: 'relay_unreachable' });
  await assert.rejects(f.host(), /relay_unreachable/);
  assert.equal(f.client.closed, 1);
  f.cleanup();
});

test('concurrent host requests share one registration operation', async () => {
  const f = fixture();
  const first = f.host();
  assert.equal(f.host(), first);
  await flush();
  assert.equal(f.client.calls, 1);
  f.message({ type: 'session_ready', code: 'ABCD', sessionId: 'session-1' });
  await first;
  f.cleanup();
});

test('a connection opening after registration timeout is closed instead of reviving the abandoned host', async () => {
  const f = fixture({ pendingConnection: true });
  const rejected = assert.rejects(f.host(), /nanah_host_registration_timeout/);
  await flush();
  f.expire();
  await rejected;
  f.releaseConnection();
  await flush();
  assert.equal(f.socket.closed, 1);
  f.cleanup();
});
