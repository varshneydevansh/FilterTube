import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class MockRequest {
  constructor(url) {
    this.url = url;
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this._body = typeof body === 'string' ? body : JSON.stringify(body);
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = init.headers || {};
    this.ok = this.status >= 200 && this.status < 300;
    this._calls = init.calls || null;
  }

  clone() {
    return new MockResponse(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      calls: this._calls
    });
  }

  async json() {
    if (this._calls) {
      this._calls.responseJson.push(this._body);
    }
    return JSON.parse(this._body);
  }

  async text() {
    return this._body;
  }
}

function makeXhr() {}
makeXhr.prototype.open = function open() {};
makeXhr.prototype.send = function send() {};
makeXhr.prototype.addEventListener = function addEventListener() {};
makeXhr.prototype.removeEventListener = function removeEventListener() {};

export function loadSeedRuntime(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const sourcePath = path.join(repoRoot, 'js', 'seed.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const payload = options.payload || {};
  const calls = {
    fetch: [],
    processData: [],
    harvestOnly: [],
    dispatchEvent: [],
    responseJson: [],
    jsonParse: [],
    jsonStringify: []
  };
  const logs = [];
  const windowObject = {
    __filtertubeDebug: options.debug === true,
    FilterTubeEngine: {
      processData(data, settings, dataName) {
        calls.processData.push({ dataName, settings: clone(settings), data: clone(data) });
        return options.processData ? options.processData(data, settings, dataName) : data;
      },
      harvestOnly(data, settings) {
        calls.harvestOnly.push({ settings: clone(settings), data: clone(data) });
      }
    },
    fetch(resource, init) {
      calls.fetch.push({ resource, init });
      return Promise.resolve(new MockResponse(payload, {
        status: options.status || 200,
        statusText: options.statusText || 'OK',
        headers: options.headers || {},
        calls
      }));
    },
    XMLHttpRequest: makeXhr,
    postMessage() {},
    dispatchEvent(event) {
      calls.dispatchEvent.push(event?.type || '');
    }
  };
  const documentObject = {
    location: {
      hostname: options.hostname || 'www.youtube.com',
      pathname: options.pathname || '/',
      origin: options.origin || 'https://www.youtube.com'
    },
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
    browser: undefined,
    Request: MockRequest,
    Response: MockResponse,
    XMLHttpRequest: makeXhr,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    URL,
    Date,
    Promise,
    WeakMap,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    JSON: {
      parse(text, reviver) {
        calls.jsonParse.push(String(text));
        return JSON.parse(text, reviver);
      },
      stringify(value, replacer, space) {
        calls.jsonStringify.push(value);
        return JSON.stringify(value, replacer, space);
      }
    },
    structuredClone: clone,
    setTimeout() {
      return 0;
    },
    clearTimeout() {}
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: sourcePath });

  return {
    context,
    window: context.window,
    calls,
    logs,
    MockResponse,
    MockRequest
  };
}
