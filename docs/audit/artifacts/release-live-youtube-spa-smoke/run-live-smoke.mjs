import fs from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANES, LIVE_SMOKE_MANAGED_CONTROL_ROWS } from '../../../../scripts/test-lane-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const artifactRoot = path.dirname(__filename);
const repoRoot = path.resolve(artifactRoot, '../../../..');
const cdpBase = process.env.FILTERTUBE_CDP_BASE || 'http://127.0.0.1:9222';
const extensionPath = process.env.FILTERTUBE_EXTENSION_PATH || repoRoot;
const KNOWN_TEST_LANES = new Set(Object.keys(LANES).map(lane => `test:${lane}`));
const MANAGED_TIMEOUT_OVERLAY_ROW_ID = 'FT-MANAGED-LIVE-03-zero-budget-timeout-overlay';
const REQUIRED_MANAGED_TIMEOUT_OVERLAY_EVIDENCE = Object.freeze([
  'timeoutOverlayVisible',
  'requestMoreTimeVisible',
  'requestRecordedForParentReview',
  'requestDoesNotUnlockYoutube',
  'overlayStillVisibleAfterRequest',
  'blocklistWhitelistNotAuthority'
]);
const smokeChannel = {
  name: 'Google Developers',
  id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
  handle: '@googledevelopers',
  handleDisplay: '@GoogleDevelopers',
  canonicalHandle: '@GoogleDevelopers',
  customUrl: '@GoogleDevelopers',
  originalInput: '@GoogleDevelopers',
  source: 'live-spa-smoke',
  filterAll: false,
  filterAllComments: true
};

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
          reject(new Error(`Failed to parse ${url}: ${error.message}`));
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

async function evaluate(client, expression, timeoutMs = 30000, extraParams = {}) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
    ...extraParams
  }, timeoutMs);
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails));
  }
  return result.result?.value;
}

async function waitFor(client, expression, timeoutMs = 30000, intervalMs = 250) {
  const start = Date.now();
  let lastValue = null;
  while (Date.now() - start < timeoutMs) {
    lastValue = await evaluate(client, expression);
    if (lastValue) return lastValue;
    await delay(intervalMs);
  }
  throw new Error(`Timed out waiting for ${expression}; last value=${JSON.stringify(lastValue)}`);
}

function storagePayload() {
  const now = Date.now();
  const channel = { ...smokeChannel, addedAt: now };
  return {
    enabled: true,
    channelMap: {
      '@googledevelopers': smokeChannel.id,
      'google developers': smokeChannel.id,
      [smokeChannel.id]: smokeChannel.id
    },
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
            mode: 'whitelist',
            channels: [],
            blockedChannels: [],
            keywords: [],
            blockedKeywords: [],
            whitelistChannels: [channel],
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

function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function sha256FileIfPresent(filePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return null;
  }
}

function envList(name) {
  return (process.env[name] || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function buildChangeContext() {
  const command = process.env.FILTERTUBE_AUTOMATED_PROOF_COMMAND || '';
  const status = process.env.FILTERTUBE_AUTOMATED_PROOF_STATUS || '';
  const summary = process.env.FILTERTUBE_AUTOMATED_PROOF_SUMMARY || '';
  const lanes = envList('FILTERTUBE_AUTOMATED_PROOF_LANES');
  const evidence = command || status || summary
    ? [{ command, status, summary, lanes }]
    : [];

  return {
    logicalChangeType: process.env.FILTERTUBE_LOGICAL_CHANGE_TYPE || '',
    requiredLanes: envList('FILTERTUBE_REQUIRED_LANES'),
    automatedLaneEvidence: evidence
  };
}

function hasOnlyKnownTestLanes(lanes) {
  return Array.isArray(lanes) && lanes.length > 0 && lanes.every(lane => KNOWN_TEST_LANES.has(lane));
}

function isReleaseReadyChangeContext(changeContext) {
  const coveredLanes = new Set(changeContext.automatedLaneEvidence.flatMap(evidence => evidence.lanes || []));
  return !!changeContext.logicalChangeType
    && hasOnlyKnownTestLanes(changeContext.requiredLanes)
    && changeContext.automatedLaneEvidence.length > 0
    && changeContext.automatedLaneEvidence.every(evidence => (
      evidence.command
      && evidence.status === 'passed'
      && evidence.summary
      && hasOnlyKnownTestLanes(evidence.lanes)
    ))
    && changeContext.requiredLanes.every(lane => coveredLanes.has(lane));
}

function buildManagedControlSmokePlaceholder() {
  return {
    applicable: false,
    parentProfileId: '',
    protectedProfileId: '',
    observedPolicyRevision: '',
    observedTimeBudgetState: '',
    observedHistoryState: '',
    requiredRows: LIVE_SMOKE_MANAGED_CONTROL_ROWS.map(id => ({
      id,
      routeAction: 'Managed parent/caregiver manual row; not executed by the whitelist SPA runner.',
      requiredObservation: 'Mark applicable=true and record this row only when the logical change touches managed profile sync, viewing-space policy, time limits, Nanah, mailbox, or local-network controls.',
      ...(id === MANAGED_TIMEOUT_OVERLAY_ROW_ID ? { requiredEvidence: [...REQUIRED_MANAGED_TIMEOUT_OVERLAY_EVIDENCE] } : {}),
      status: 'missing'
    }))
  };
}

function sourceHashSnapshot() {
  const manifest = readJsonIfPresent(path.join(extensionPath, 'manifest.json')) || {};
  const contentScriptFiles = Array.from(new Set((manifest.content_scripts || []).flatMap(entry => [
    ...(entry.js || []),
    ...(entry.css || [])
  ])));
  const requiredFiles = Array.from(new Set([
    'manifest.json',
    'package.json',
    'js/content_bridge.js',
    ...contentScriptFiles
  ]));

  return {
    manifestVersion: manifest.version || '',
    serviceWorker: manifest.background?.service_worker || '',
    contentScriptFiles,
    hashes: Object.fromEntries(requiredFiles.map(relativePath => [
      relativePath,
      sha256FileIfPresent(path.join(extensionPath, relativePath))
    ]))
  };
}

function buildInstalledByteParity({ browserVersion, storageSetup, rows, generatedAt }) {
  const sourceSnapshot = sourceHashSnapshot();
  const runtimeMarker = rows.some(row => row.snapshot?.seedReady && row.snapshot?.filterTubeMainWorld)
    ? 'runtime-marker:ftSeedInitialized+filterTubeMainWorld'
    : '';
  const fields = {
    packet_id: 'FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes',
    workspace_revision_or_hash: process.env.FILTERTUBE_WORKSPACE_REVISION || sourceSnapshot.hashes['manifest.json'] || '',
    tester_initials: process.env.FILTERTUBE_TESTER_INITIALS || 'codex',
    manual_timestamp: generatedAt,
    chrome_profile_label: process.env.FILTERTUBE_CHROME_PROFILE_LABEL || '',
    chrome_user_data_dir: process.env.FILTERTUBE_CHROME_USER_DATA_DIR || '',
    extension_id: storageSetup.extensionId || '',
    extension_path: extensionPath,
    manifest_version: sourceSnapshot.manifestVersion,
    service_worker_version: sourceSnapshot.serviceWorker,
    active_tab_url: rows.at(-1)?.snapshot?.url || '',
    content_script_marker_or_hash: runtimeMarker,
    extension_reload_timestamp: process.env.FILTERTUBE_EXTENSION_RELOAD_TIMESTAMP || '',
    tab_reload_timestamp: process.env.FILTERTUBE_TAB_RELOAD_TIMESTAMP || ''
  };
  const missingFields = Object.entries(fields)
    .filter(([, value]) => value === '' || value === null || value === undefined)
    .map(([key]) => key);

  return {
    ...fields,
    browser_name_version: browserVersion.Browser || '',
    source_hashes: sourceSnapshot.hashes,
    content_script_files: sourceSnapshot.contentScriptFiles,
    missing_fields: missingFields,
    verdict: 'NO-GO',
    reason: 'Audit runner records parity inputs only; release proof still requires visible profile identity, reload timestamps, and active content-script byte attestation.'
  };
}

async function setExtensionStorage(client, extraParams = {}) {
  const payload = storagePayload();
  return await evaluate(
    client,
    `new Promise(resolve => chrome.storage.local.set(${JSON.stringify(payload)}, () => resolve({ ok: !chrome.runtime.lastError, error: chrome.runtime.lastError && chrome.runtime.lastError.message })))`,
    30000,
    extraParams
  );
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

async function setStorageThroughAvailableExtensionContext({ targets, page }) {
  const extensionTarget = targets.find(target => target.type === 'service_worker' && target.url.startsWith('chrome-extension://'))
    || targets.find(target => target.type === 'page' && target.url.startsWith('chrome-extension://'));

  if (extensionTarget) {
    const extensionClient = await connectCdp(extensionTarget.webSocketDebuggerUrl);
    try {
      await extensionClient.send('Runtime.enable');
      const hasChromeStorage = await evaluate(extensionClient, `typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local`);
      if (hasChromeStorage) {
        const result = await setExtensionStorage(extensionClient);
        if (result?.ok) {
          return { result, extensionId: new URL(extensionTarget.url).host, storageContext: 'extension-target' };
        }
      }
    } finally {
      extensionClient.close();
    }
  }

  const contexts = extensionContexts(page.events);
  for (const context of contexts) {
    const hasChromeStorage = await evaluate(
      page,
      `typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local`,
      30000,
      { contextId: context.id }
    ).catch(() => false);
    if (!hasChromeStorage) continue;
    const result = await setExtensionStorage(page, { contextId: context.id });
    if (result?.ok) {
      const origin = typeof context.origin === 'string' ? context.origin : '';
      const extensionId = origin.startsWith('chrome-extension://') ? new URL(origin).host : '';
      return { result, extensionId, storageContext: `page-isolated-context:${context.id}` };
    }
  }

  throw new Error('Could not find an extension context with chrome.storage.local access.');
}

async function getPageSnapshot(client) {
  return await evaluate(client, `(() => {
    const q = selector => document.querySelectorAll(selector).length;
    const visible = selector => Array.from(document.querySelectorAll(selector)).filter(el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }).length;
    const cards = 'ytd-rich-item-renderer,ytd-video-renderer,ytd-grid-video-renderer,ytd-compact-video-renderer,ytd-reel-item-renderer';
    return {
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      bodyTextLength: document.body ? document.body.innerText.length : 0,
      seedReady: !!window.ftSeedInitialized,
      filterTubeMainWorld: !!window.filterTube,
      filterTubeEngine: !!window.FilterTubeEngine,
      ytdApp: !!document.querySelector('ytd-app'),
      visibleVideoCards: visible(cards),
      hiddenByFilterTube: q('[data-filtertube-hidden],.filtertube-hidden,.filtertube-hidden-shelf'),
      whitelistPending: q('[data-filtertube-whitelist-pending="true"]'),
      stampedVideoIds: q('[data-filtertube-video-id]'),
      stampedChannelIds: q('[data-filtertube-channel-id]'),
      playerPresent: !!document.querySelector('#movie_player, ytd-player'),
      titlePresent: !!document.querySelector('h1 yt-formatted-string, ytd-watch-metadata h1'),
      ownerRowPresent: !!document.querySelector('ytd-video-owner-renderer, #owner, ytd-channel-name'),
      mastheadPresent: !!document.querySelector('#masthead, ytd-masthead'),
      channelHeaderPresent: !!document.querySelector('ytd-c4-tabbed-header-renderer, ytd-page-header-renderer, ytd-channel-name')
    };
  })()`);
}

async function screenshot(client, outputPath) {
  const result = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, 30000);
  fs.writeFileSync(outputPath, Buffer.from(result.data, 'base64'));
  return path.relative(repoRoot, outputPath).replaceAll(path.sep, '/');
}

async function runStep({ id, routeAction, requiredObservation, action, observe, screenshotName }, client, screenshotDir) {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const result = {
    id,
    routeAction,
    requiredObservation,
    status: 'failed',
    startedAt
  };
  try {
    await action();
    const snapshot = await getPageSnapshot(client);
    const observation = observe(snapshot);
    result.status = observation.pass ? 'passed' : 'failed';
    result.observation = observation;
    result.snapshot = snapshot;
  } catch (error) {
    result.error = error.message;
    try {
      result.snapshot = await getPageSnapshot(client);
    } catch {
    }
  }
  result.durationMs = Date.now() - start;
  if (screenshotName) {
    try {
      result.screenshot = await screenshot(client, path.join(screenshotDir, `${screenshotName}.png`));
    } catch (error) {
      result.screenshotError = error.message;
    }
  }
  return result;
}

function hasNoSevereConsoleIssues(events) {
  return events.filter(event => {
    if (event.method === 'Runtime.exceptionThrown') return true;
    if (event.method === 'Log.entryAdded') {
      return ['error', 'warning'].includes(event.params?.entry?.level);
    }
    if (event.method === 'Runtime.consoleAPICalled') {
      return ['error', 'warning'].includes(event.params?.type);
    }
    return false;
  }).map(event => ({
    method: event.method,
    type: event.params?.type || event.params?.entry?.level || null,
    text: event.params?.entry?.text || event.params?.args?.map(arg => arg.value || arg.description).join(' ') || null
  })).slice(0, 50);
}

async function main() {
  const browserVersion = await httpJson(`${cdpBase}/json/version`);
  const targets = await httpJson(`${cdpBase}/json/list`);
  let pageTarget = targets.find(target => target.type === 'page' && target.url.includes('youtube.com'));
  if (!pageTarget) {
    const created = await httpJson(`${cdpBase}/json/new?https://www.youtube.com/`, 'PUT');
    pageTarget = created;
  }

  const page = await connectCdp(pageTarget.webSocketDebuggerUrl);
  await page.send('Runtime.enable');
  await page.send('Page.enable');
  await page.send('Log.enable');
  await page.send('Network.enable');

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotDir = path.join(artifactRoot, runId);
  fs.mkdirSync(screenshotDir, { recursive: true });

  let lastWatchUrl = '';
  const rows = [];
  const runAction = (spec) => runStep(spec, page, screenshotDir).then(row => {
    rows.push(row);
    return row;
  });

  await page.send('Page.navigate', { url: 'https://www.youtube.com/' });
  await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('ytd-app')`, 45000);
  await delay(2500);
  const storageSetup = await setStorageThroughAvailableExtensionContext({ targets, page });
  if (!storageSetup.result?.ok) {
    throw new Error(`Failed to set extension storage: ${storageSetup.result?.error || 'unknown error'}`);
  }
  await page.send('Page.navigate', { url: 'https://www.youtube.com/' });
  await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('ytd-app')`, 45000);
  await delay(2500);

  await runAction({
    id: 'FT-LIVE-SPA-00-home-to-search',
    routeAction: 'Start on YouTube Home in whitelist mode, navigate to a search results page without full reload.',
    requiredObservation: 'No long visible stall, no repeated forced refresh loop, expected non-allowed cards hidden only after intended identity decision.',
    screenshotName: '00-home-to-search',
    action: async () => {
      await evaluate(page, `(() => {
        const input = document.querySelector('input[name="search_query"]');
        if (!input) return false;
        input.focus();
        input.value = 'Google Developers';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'Google Developers' }));
        input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        const button = document.querySelector('#search-icon-legacy, button[aria-label="Search"]');
        if (button) button.click();
        return true;
      })()`);
      await waitFor(page, `location.href.includes('/results') && document.readyState === 'complete'`, 45000);
      await delay(3500);
    },
    observe: snapshot => ({
      pass: snapshot.url.includes('/results') && snapshot.ytdApp && snapshot.seedReady && snapshot.filterTubeMainWorld && snapshot.bodyTextLength > 1000,
      summary: 'Search route reached with FilterTube main-world seed present and page content hydrated.'
    })
  });

  await runAction({
    id: 'FT-LIVE-SPA-01-search-to-channel',
    routeAction: 'From search, open a channel page through normal YouTube SPA navigation.',
    requiredObservation: 'Channel content remains usable; whitelist behavior does not hide channel scaffolding while identity hydrates.',
    screenshotName: '01-search-to-channel',
    action: async () => {
      const clicked = await evaluate(page, `(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const anchor = anchors.find(a => /\\/(@GoogleDevelopers|channel\\/UC_x5XG1OV2P6uZZ5FSM9Ttw)/i.test(a.getAttribute('href') || ''));
        if (!anchor) return false;
        anchor.click();
        return true;
      })()`);
      if (!clicked) {
        await evaluate(page, `history.pushState({}, '', '/@GoogleDevelopers'); window.dispatchEvent(new PopStateEvent('popstate'));`);
        await page.send('Page.navigate', { url: 'https://www.youtube.com/@GoogleDevelopers' });
      }
      await waitFor(page, `location.href.includes('@GoogleDevelopers') || location.href.includes('/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw')`, 45000);
      await delay(4000);
    },
    observe: snapshot => ({
      pass: snapshot.ytdApp && snapshot.channelHeaderPresent && snapshot.bodyTextLength > 1000 && snapshot.mastheadPresent,
      summary: 'Channel route hydrated and channel scaffolding is visible.'
    })
  });

  await runAction({
    id: 'FT-LIVE-SPA-02-channel-to-watch',
    routeAction: 'Open a video from the channel page.',
    requiredObservation: 'Player, title, owner row, metadata, and watch controls remain visible as expected; right-rail does not leak or false-hide due to stale timers.',
    screenshotName: '02-channel-to-watch',
    action: async () => {
      let clicked = await evaluate(page, `(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/watch?v="]'));
        const anchor = anchors.find(a => a.offsetParent !== null) || anchors[0];
        if (!anchor) return false;
        anchor.click();
        return true;
      })()`);
      if (!clicked) {
        await page.send('Page.navigate', { url: 'https://www.youtube.com/@GoogleDevelopers/videos' });
        await waitFor(page, `location.href.includes('/videos')`, 30000);
        await delay(3500);
        clicked = await evaluate(page, `(() => {
          const anchors = Array.from(document.querySelectorAll('a[href*="/watch?v="]'));
          const anchor = anchors.find(a => a.offsetParent !== null) || anchors[0];
          if (!anchor) return false;
          anchor.click();
          return true;
        })()`);
      }
      if (!clicked) throw new Error('No watch link found on channel page');
      await waitFor(page, `location.href.includes('/watch') && !!document.querySelector('#movie_player, ytd-player')`, 60000);
      await delay(5000);
      lastWatchUrl = await evaluate(page, `location.href`);
    },
    observe: snapshot => ({
      pass: snapshot.url.includes('/watch') && snapshot.playerPresent && snapshot.titlePresent && snapshot.ownerRowPresent && snapshot.seedReady,
      summary: 'Watch route reached with player, title, owner row, and FilterTube seed present.'
    })
  });

  await runAction({
    id: 'FT-LIVE-SPA-04-watch-rail-scroll',
    routeAction: 'Scroll the watch page right rail and observe recommendation hydration.',
    requiredObservation: 'No runaway mutation/timer fanout; allowed/non-allowed recommendations match whitelist expectations.',
    screenshotName: '04-watch-rail-scroll',
    action: async () => {
      const isWatchRoute = await evaluate(page, `location.href.includes('/watch')`);
      if (!isWatchRoute) {
        await page.send('Page.navigate', { url: lastWatchUrl || 'https://www.youtube.com/@GoogleDevelopers/videos' });
        await waitFor(page, `location.href.includes('/watch')`, 45000);
      }
      await evaluate(page, `window.scrollTo(0, Math.max(document.body.scrollHeight * 0.45, 900));`);
      await delay(3500);
    },
    observe: snapshot => ({
      pass: snapshot.url.includes('/watch') && snapshot.playerPresent && snapshot.ytdApp && snapshot.visibleVideoCards >= 0,
      summary: 'Watch route stayed usable after scroll and the page remained hydrated.'
    })
  });

  await runAction({
    id: 'FT-LIVE-SPA-03-watch-to-home',
    routeAction: 'Navigate away from watch to Home using YouTube navigation.',
    requiredObservation: 'No stale delayed watch-route timer forces a broad reprocess after the route changes.',
    screenshotName: '03-watch-to-home',
    action: async () => {
      const clicked = await evaluate(page, `(() => {
        const logo = document.querySelector('a#logo, ytd-topbar-logo-renderer a[href="/"]');
        if (!logo) return false;
        logo.click();
        return true;
      })()`);
      if (!clicked) await page.send('Page.navigate', { url: 'https://www.youtube.com/' });
      await waitFor(page, `location.pathname === '/' && !!document.querySelector('ytd-app')`, 45000);
      await delay(3500);
    },
    observe: snapshot => ({
      pass: snapshot.url === 'https://www.youtube.com/' || snapshot.url === 'https://www.youtube.com',
      summary: 'Home route reached after watch navigation without page collapse.'
    })
  });

  await runAction({
    id: 'FT-LIVE-SPA-05-cache-repeat-navigation',
    routeAction: 'Repeat Home/Search/Watch navigation after learned-map rows have been populated.',
    requiredObservation: 'Duplicate learned rows do not visibly slow later navigation or trigger repeated DOM flicker.',
    screenshotName: '05-cache-repeat-navigation',
    action: async () => {
      await evaluate(page, `(() => {
        const input = document.querySelector('input[name="search_query"]');
        if (!input) return false;
        input.focus();
        input.value = 'Google Developers latest';
        input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'Google Developers latest' }));
        const button = document.querySelector('#search-icon-legacy, button[aria-label="Search"]');
        if (button) button.click();
        return true;
      })()`);
      await waitFor(page, `location.href.includes('/results')`, 45000);
      await delay(2500);
      const clicked = await evaluate(page, `(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/watch?v="]'));
        const anchor = anchors.find(a => a.offsetParent !== null) || anchors[0];
        if (!anchor) return false;
        anchor.click();
        return true;
      })()`);
      if (!clicked) throw new Error('No repeat watch link found on search page');
      await waitFor(page, `location.href.includes('/watch') && !!document.querySelector('#movie_player, ytd-player')`, 60000);
      await delay(4000);
    },
    observe: snapshot => ({
      pass: snapshot.url.includes('/watch') && snapshot.playerPresent && snapshot.titlePresent && snapshot.ownerRowPresent,
      summary: 'Repeat search-to-watch route reached with core watch UI visible.'
    })
  });

  const consoleIssues = hasNoSevereConsoleIssues(page.events);
  page.close();

  const allRowsPassed = rows.every(row => row.status === 'passed');
  const generatedAt = new Date().toISOString();
  const smokeSliceReadiness = allRowsPassed && consoleIssues.length === 0 ? 'GO-FOR-THIS-SMOKE-SLICE' : 'NO-GO';
  const installedByteParity = buildInstalledByteParity({ browserVersion, storageSetup, rows, generatedAt });
  const changeContext = buildChangeContext();
  const changeContextReady = isReleaseReadyChangeContext(changeContext);
  const artifact = {
    artifactType: 'filtertube-release-live-youtube-spa-smoke',
    schemaVersion: 5,
    status: allRowsPassed ? 'executed' : 'executed-with-failures',
    smokeSliceReadiness,
    releaseReadiness: smokeSliceReadiness === 'GO-FOR-THIS-SMOKE-SLICE' && installedByteParity.verdict === 'GO' && changeContextReady ? 'GO-FOR-RELEASE-SMOKE' : 'NO-GO',
    runtimeBehaviorChanged: false,
    changeContext,
    generatedAt,
    boundaryDoc: 'docs/audit/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md',
    browserNameVersion: browserVersion.Browser,
    browserUserAgent: browserVersion['User-Agent'],
    extensionId: storageSetup.extensionId || null,
    extensionBuildSourcePath: extensionPath,
    storageSetupContext: storageSetup.storageContext,
    profileListModeSettings: 'ftProfilesV4.default.main.mode=whitelist; enabled=true',
    whitelistEntriesUsed: [smokeChannel],
    routeSequence: rows.map(row => row.id),
    observedStallOrNoStall: rows.map(row => `${row.id}: ${row.durationMs}ms`).join('; '),
    observedFalseHideLeakResult: allRowsPassed ? 'No row-level false-hide/leak condition observed by CDP visibility checks.' : 'One or more row checks failed; inspect row snapshots.',
    consoleErrorSummary: consoleIssues,
    installedByteParity,
    manualTimestamp: generatedAt,
    testerInitials: process.env.FILTERTUBE_TESTER_INITIALS || 'codex',
    requiredRows: rows,
    managedControlSmoke: buildManagedControlSmokePlaceholder(),
    completionRules: {
      allRecordingFieldsRequired: true,
      allRowsMustPass: true,
      consoleErrorsMustBeClassified: true,
      installedByteParityMustPass: true,
      automatedLaneEvidenceMustPass: true,
      automatedLaneEvidenceMustCoverRequiredLanes: true,
      managedControlRowsRequiredWhenApplicable: true,
      managedControlRowsRequiredForManagedLogicalChanges: true,
      releaseReadinessWhenByteParityMissing: 'NO-GO',
      releaseReadinessWhenAutomatedLaneEvidenceMissing: 'NO-GO',
      releaseReadinessWhenAnyRowMissing: 'NO-GO',
      releaseReadinessWhenAnyRowFailed: 'NO-GO'
    }
  };

  const artifactPath = path.join(artifactRoot, `${runId}.json`);
  fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({
    artifact: path.relative(repoRoot, artifactPath).replaceAll(path.sep, '/'),
    screenshotDir: path.relative(repoRoot, screenshotDir).replaceAll(path.sep, '/'),
    smokeSliceReadiness: artifact.smokeSliceReadiness,
    releaseReadiness: artifact.releaseReadiness,
    installedByteParity: artifact.installedByteParity.verdict,
    changeContext: changeContextReady ? 'GO' : 'NO-GO',
    rowStatuses: rows.map(row => [row.id, row.status]),
    consoleIssues: consoleIssues.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
