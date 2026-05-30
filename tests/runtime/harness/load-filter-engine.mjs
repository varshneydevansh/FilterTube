import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function loadFilterTubeEngine(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const sourcePath = path.join(repoRoot, 'js', 'filter_logic.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const messages = [];
  const logs = [];
  const timers = [];
  const windowObject = {
    __filtertubeDebug: options.debug === true,
    postMessage(message) {
      messages.push(message);
    },
    FilterTubeIdentity: options.identity || undefined
  };
  const documentObject = {
    location: { pathname: options.pathname || '/' },
    documentElement: {
      getAttribute(name) {
        if (name === 'data-filtertube-debug') {
          return options.debug === true ? 'true' : null;
        }
        return null;
      }
    }
  };
  const context = {
    window: windowObject,
    document: documentObject,
    console: {
      log: (...args) => logs.push({ level: 'log', args }),
      debug: (...args) => logs.push({ level: 'debug', args }),
      warn: (...args) => logs.push({ level: 'warn', args }),
      error: (...args) => logs.push({ level: 'error', args })
    },
    setTimeout(callback) {
      if (typeof callback === 'function') {
        timers.push(callback);
      }
      return timers.length;
    },
    clearTimeout() {},
    Date,
    RegExp,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    JSON
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: sourcePath });

  if (!context.window.FilterTubeEngine) {
    throw new Error('FilterTubeEngine was not exported by js/filter_logic.js');
  }

  return {
    engine: context.window.FilterTubeEngine,
    context,
    messages,
    logs,
    flushTimers() {
      while (timers.length > 0) {
        const callback = timers.shift();
        callback();
      }
    }
  };
}
