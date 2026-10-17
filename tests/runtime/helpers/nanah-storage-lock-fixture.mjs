import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../../js/nanah_storage_lock.js', import.meta.url), 'utf8');

// Test-only exclusive Web Locks model. A callback's returned promise keeps its
// named lock held; rejection releases it and does not poison queued requests.
export function createSharedLockManager() {
  const tails = new Map();
  const requests = [];
  return {
    requests,
    request(name, options, callback) {
      if (typeof options === 'function') { callback = options; options = {}; }
      const mode = options?.mode || 'exclusive';
      if (mode !== 'exclusive' || typeof callback !== 'function') return Promise.reject(new TypeError('Fixture supports exclusive lock callbacks only'));
      requests.push({ name, mode });
      const previous = tails.get(name) || Promise.resolve();
      const result = previous.then(() => callback({ name, mode }));
      const released = result.then(() => {}, () => {});
      tails.set(name, released);
      released.then(() => { if (tails.get(name) === released) tails.delete(name); });
      return result;
    }
  };
}

export function installNanahStorageLock(context, { locks = createSharedLockManager() } = {}) {
  const target = context.window || context;
  const navigator = { ...context.navigator, ...target.navigator, locks };
  context.navigator = navigator;
  target.navigator = navigator;
  if (vm.isContext(context)) vm.runInContext(source, context);
  else vm.runInNewContext(source, context);
  return target.FilterTubeNanahStorageLock;
}
