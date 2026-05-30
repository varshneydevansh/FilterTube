import http from 'node:http';

const cdpBase = process.env.FILTERTUBE_CDP_BASE || 'http://127.0.0.1:9222';
const watchUrl = process.env.FILTERTUBE_PROBE_URL || 'https://www.youtube.com/watch?v=f9D8gHY2OPE';

let cdpMessageId = 1;

function httpJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Failed to parse ${url}: ${error.message}; body=${body.slice(0, 200)}`));
        }
      });
    });
    request.on('error', reject);
    request.end();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out opening ${wsUrl}`)), 10000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error(`Failed to open ${wsUrl}`));
    }, { once: true });
  });

  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(`${message.error.code}: ${message.error.message}`));
      } else {
        resolve(message.result || {});
      }
      return;
    }
    events.push(message);
  });

  return {
    events,
    async send(method, params = {}, timeoutMs = 30000) {
      const id = cdpMessageId++;
      ws.send(JSON.stringify({ id, method, params }));
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (!pending.has(id)) return;
          pending.delete(id);
          reject(new Error(`Timed out waiting for ${method}`));
        }, timeoutMs);
        pending.set(id, {
          resolve(value) {
            clearTimeout(timer);
            resolve(value);
          },
          reject(error) {
            clearTimeout(timer);
            reject(error);
          }
        });
      });
    },
    close() {
      try {
        ws.close();
      } catch {
      }
    }
  };
}

async function evaluate(client, expression, extraParams = {}) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
    ...extraParams
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails));
  }
  return result.result?.value;
}

async function waitFor(client, expression, timeoutMs = 45000, intervalMs = 250) {
  const start = Date.now();
  let lastValue = null;
  while (Date.now() - start < timeoutMs) {
    lastValue = await evaluate(client, expression).catch(error => ({ error: error.message }));
    if (lastValue === true || (lastValue && lastValue.ok)) return lastValue;
    await delay(intervalMs);
  }
  throw new Error(`Timed out waiting for ${expression}; last=${JSON.stringify(lastValue)}`);
}

function emptyStoragePayload() {
  return {
    enabled: true,
    uiKeywords: [],
    filterKeywords: [],
    filterKeywordsComments: [],
    filterChannels: [],
    channelMap: {},
    videoChannelMap: {},
    videoMetaMap: {},
    ftProfilesV4: {
      schemaVersion: 4,
      activeProfileId: 'default',
      profiles: {
        default: {
          type: 'account',
          parentProfileId: null,
          name: 'Default',
          settings: {
            syncKidsToMain: false,
            enabled: true,
            hideShorts: false,
            hideComments: false,
            hideHomeFeed: false,
            hideSponsoredCards: false,
            hideWatchPlaylistPanel: false,
            hidePlaylistCards: false,
            hideMembersOnly: false,
            hideMixPlaylists: false,
            hideVideoSidebar: false,
            hideRecommended: false,
            hideLiveChat: false,
            hideVideoInfo: false,
            hideVideoButtonsBar: false,
            hideAskButton: false,
            hideVideoChannelRow: false,
            hideVideoDescription: false,
            hideMerchTicketsOffers: false,
            hideEndscreenVideowall: false,
            hideEndscreenCards: false,
            disableAutoplay: false,
            disableAnnotations: false,
            hideTopHeader: false,
            hideNotificationBell: false,
            hideExploreTrending: false,
            hideMoreFromYouTube: false,
            hideSubscriptions: false,
            showQuickBlockButton: true,
            showBlockMenuItem: true,
            hideSearchShelves: false
          },
          main: {
            mode: 'blocklist',
            channels: [],
            blockedChannels: [],
            keywords: [],
            blockedKeywords: [],
            whitelistChannels: [],
            whitelistKeywords: []
          },
          kids: {
            mode: 'blocklist',
            strictMode: true,
            blockedChannels: [],
            blockedKeywords: [],
            whitelistChannels: [],
            whitelistKeywords: [],
            videoIds: [],
            subscriptions: [],
            contentFilters: {},
            categoryFilters: {}
          }
        }
      }
    }
  };
}

function extensionContexts(events) {
  return events
    .filter(event => event.method === 'Runtime.executionContextCreated')
    .map(event => event.params?.context)
    .filter(Boolean)
    .filter(context => {
      const origin = typeof context.origin === 'string' ? context.origin : '';
      const type = context.auxData?.type || '';
      return origin.startsWith('chrome-extension://') || type === 'isolated';
    });
}

async function setStorage({ targets, page }) {
  const payload = emptyStoragePayload();
  const extensionTarget = targets.find(target => target.type === 'service_worker' && target.url.startsWith('chrome-extension://'))
    || targets.find(target => target.type === 'page' && target.url.startsWith('chrome-extension://'));

  if (extensionTarget) {
    const extensionClient = await connectCdp(extensionTarget.webSocketDebuggerUrl);
    try {
      await extensionClient.send('Runtime.enable');
      const hasStorage = await evaluate(extensionClient, `typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local`);
      if (hasStorage) {
        const result = await evaluate(
          extensionClient,
          `new Promise(resolve => chrome.storage.local.clear(() => chrome.storage.local.set(${JSON.stringify(payload)}, () => resolve({ ok: !chrome.runtime.lastError, error: chrome.runtime.lastError?.message || null }))))`
        );
        if (result?.ok) return { ok: true, context: 'extension-target', extensionId: new URL(extensionTarget.url).host };
      }
    } finally {
      extensionClient.close();
    }
  }

  for (const context of extensionContexts(page.events)) {
    const hasStorage = await evaluate(
      page,
      `typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local`,
      { contextId: context.id }
    ).catch(() => false);
    if (!hasStorage) continue;
    const result = await evaluate(
      page,
      `new Promise(resolve => chrome.storage.local.clear(() => chrome.storage.local.set(${JSON.stringify(payload)}, () => resolve({ ok: !chrome.runtime.lastError, error: chrome.runtime.lastError?.message || null }))))`,
      { contextId: context.id }
    );
    if (result?.ok) {
      const origin = typeof context.origin === 'string' ? context.origin : '';
      return {
        ok: true,
        context: `page-isolated-context:${context.id}`,
        extensionId: origin.startsWith('chrome-extension://') ? new URL(origin).host : ''
      };
    }
  }

  return { ok: false, context: 'none' };
}

async function main() {
  const version = await httpJson(`${cdpBase}/json/version`);
  let targets = await httpJson(`${cdpBase}/json/list`);
  let pageTarget = targets.find(target => target.type === 'page');
  if (!pageTarget) {
    pageTarget = await httpJson(`${cdpBase}/json/new?about:blank`, 'PUT');
  }

  const page = await connectCdp(pageTarget.webSocketDebuggerUrl);
  try {
    await page.send('Runtime.enable');
    await page.send('Page.enable');
    await page.send('Log.enable');

    await page.send('Page.navigate', { url: 'https://www.youtube.com/' });
    await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('ytd-app')`);
    await delay(1500);
    targets = await httpJson(`${cdpBase}/json/list`);
    const storage = await setStorage({ targets, page });
    if (!storage.ok) {
      const contexts = page.events
        .filter(event => event.method === 'Runtime.executionContextCreated')
        .map(event => event.params?.context)
        .filter(Boolean)
        .map(context => ({
          id: context.id,
          origin: context.origin,
          name: context.name,
          auxData: context.auxData
        }));
      const mainWorldBeforeStorage = await evaluate(page, `(() => ({
        href: location.href,
        seedReady: !!window.ftSeedInitialized,
        filterTubeObject: !!window.filterTube,
        filterTubeEngineLoaded: !!window.FilterTubeEngine
      }))()`).catch(error => ({ error: error.message }));
      console.log(JSON.stringify({ storage, targets, contexts, mainWorldBeforeStorage }, null, 2));
      throw new Error(`failed to set empty storage through ${storage.context}`);
    }

    await page.send('Page.navigate', { url: watchUrl });
    await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('ytd-app')`);
    await delay(4500);

    const mainWorld = await evaluate(page, `(() => ({
      href: location.href,
      seedReady: !!window.ftSeedInitialized,
      filterTubeObject: !!window.filterTube,
      filterTubeStats: window.filterTube?.getStats?.() || null,
      filterTubeEngineLoaded: !!window.FilterTubeEngine,
      injectorReady: !!window.filterTubeInjectorBridgeReady || !!window.ftInitialized,
      hiddenCount: document.querySelectorAll('[data-filtertube-hidden],.filtertube-hidden,.filtertube-hidden-shelf').length,
      quickBlockWraps: document.querySelectorAll('.filtertube-quick-block-wrap').length,
      fallbackMenuButtons: document.querySelectorAll('.filtertube-playlist-menu-fallback-btn').length
    }))()`);

    const isolated = [];
    for (const context of extensionContexts(page.events)) {
      const summary = await evaluate(page, `(() => {
        const settings = typeof currentSettings === 'object' && currentSettings ? currentSettings : null;
        return {
          contextId: ${context.id},
          origin: ${JSON.stringify(context.origin || '')},
          hasChromeStorage: typeof chrome !== 'undefined' && !!chrome.storage?.local,
          settings: settings ? {
            enabled: settings.enabled,
            listMode: settings.listMode,
            filterKeywords: Array.isArray(settings.filterKeywords) ? settings.filterKeywords.length : null,
            filterChannels: Array.isArray(settings.filterChannels) ? settings.filterChannels.length : null,
            showQuickBlockButton: settings.showQuickBlockButton
          } : null,
          mainWorldScriptsInjected: !!globalThis.__filtertubeBridgeState?.scriptsInjected,
          quickBlockRefreshResult: typeof window.FilterTube_refreshQuickBlockAvailability === 'function'
            ? window.FilterTube_refreshQuickBlockAvailability({ force: true })
            : null,
          domFallbackObserverRefreshResult: typeof window.FilterTube_refreshDOMFallbackObserver === 'function'
            ? window.FilterTube_refreshDOMFallbackObserver()
            : null
        };
      })()`, { contextId: context.id }).catch(error => ({ contextId: context.id, error: error.message }));
      isolated.push(summary);
    }

    console.log(JSON.stringify({
      browser: version.Browser,
      storage,
      mainWorld,
      isolated,
      severeConsoleEvents: page.events.filter(event => {
        if (event.method === 'Runtime.exceptionThrown') return true;
        if (event.method === 'Log.entryAdded') return ['error', 'warning'].includes(event.params?.entry?.level);
        if (event.method === 'Runtime.consoleAPICalled') return ['error', 'warning'].includes(event.params?.type);
        return false;
      }).slice(0, 20)
    }, null, 2));
  } finally {
    page.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
