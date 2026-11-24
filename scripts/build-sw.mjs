/**
 * Generates dist/sw.js:
 *  - precaches the app shell, fonts, icons and core data (fast first paint offline)
 *  - caches visited pages and data at runtime
 *  - CACHE_LIBRARY downloads the whole song / manna / Sabbath library in the background
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const BASE = (process.env.VITE_BASE || '/ATT-WEB/').replace(/\/*$/, '/');

const walk = async (dir, prefix = '') => {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walk(path.join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
};

const distFiles = await walk(DIST);
const dataFiles = distFiles.filter((file) => file.startsWith('data/'));
const assetFiles = distFiles.filter((file) => file.startsWith('assets/'));
const iconFiles = distFiles.filter((file) => file.startsWith('icons/'));

const toUrl = (rel) => (rel === 'index.html' ? BASE : `${BASE}${rel}`);

const CORE_PATHS = [
  BASE,
  `${BASE}404.html`,
  `${BASE}manifest.webmanifest`,
  ...iconFiles.map(toUrl),
  ...assetFiles.filter((file) => /\.(js|css|ttf|woff2?|png|svg)$/.test(file)).map(toUrl),
  ...dataFiles
    .filter(
      (file) =>
        /^data\/(home|stats|manna-index|sabbath-index)\.json$/.test(file) ||
        /^data\/meta\/[^/]+\.json$/.test(file) ||
        /^data\/gist\/[^/]+$/.test(file)
    )
    .map(toUrl),
];

const coreSet = new Set(CORE_PATHS);
const LIBRARY_PATHS = [
  ...dataFiles
    .filter(
      (file) =>
        /^data\/songs\/[^/]+\/[^/]+\.json$/.test(file) ||
        /^data\/manna\/[^/]+\.json$/.test(file) ||
        /^data\/sabbath\/[^/]+\/[^/]+\.json$/.test(file)
    )
    .map(toUrl),
].filter((url) => !coreSet.has(url));

const unique = (list) => [...new Set(list)];

const version = crypto
  .createHash('sha1')
  .update(unique(CORE_PATHS).join('|'))
  .update(unique(LIBRARY_PATHS).join('|'))
  .digest('hex')
  .slice(0, 10);

const sw = `/* Adventist Tamil Tool service worker — generated ${new Date().toISOString()} */
const VERSION = '${version}';
const BASE = '${BASE}';
const CORE_PATHS = ${JSON.stringify(unique(CORE_PATHS))};
const LIBRARY_PATHS = ${JSON.stringify(unique(LIBRARY_PATHS))};

const CORE_CACHE = 'att-core-' + VERSION;
const RUNTIME_CACHE = 'att-runtime-' + VERSION;
const LIBRARY_CACHE = 'att-library-' + VERSION;
const APP_CACHES = [CORE_CACHE, RUNTIME_CACHE, LIBRARY_CACHE];

const abs = (p) => new URL(p, self.location.origin).href;
const CORE_URLS = CORE_PATHS.map(abs);
const LIBRARY_URLS = LIBRARY_PATHS.map(abs);

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE_CACHE);
      await Promise.allSettled(
        CORE_URLS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: 'reload' }));
            if (response && response.ok) await cache.put(url, response);
          } catch (error) {
            /* keep installing; missing files can be fetched later */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith('att-') && !APP_CACHES.includes(key)).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

const cacheFirst = async (request) => {
  const runtime = await caches.open(RUNTIME_CACHE);
  const hit = (await runtime.match(request)) || (await caches.open(CORE_CACHE).then((c) => c.match(request)));
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response && response.ok) runtime.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
};

const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await withTimeout(fetch(request), 6500);
    // A gateway/proxy error is as unusable as being offline — use the cache instead.
    if (response && response.status >= 500) throw new Error('server error ' + response.status);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = (await cache.match(request, { ignoreSearch: true })) || (await caches.open(CORE_CACHE).then((c) => c.match(request, { ignoreSearch: true })));
    if (hit) return hit;
    return new Response('{"offline":true}', {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return hit || (await network) || new Response('', { status: 504 });
};

const handleNavigate = async (request) => {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await withTimeout(fetch(request), 6000);
    if (response && response.status >= 500) throw new Error('server error ' + response.status);
    if (response && response.ok) runtime.put(request, response.clone());
    return response;
  } catch (error) {
    const hit =
      (await runtime.match(request, { ignoreSearch: true })) ||
      (await caches.open(CORE_CACHE).then((c) => c.match(request, { ignoreSearch: true })));
    if (hit) return hit;
    const core = await caches.open(CORE_CACHE);
    return (
      (await core.match(abs(BASE + '404.html'))) ||
      (await core.match(abs(BASE))) ||
      new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } })
    );
  }
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request));
    return;
  }
  if (url.pathname.startsWith(BASE + 'data/')) {
    event.respondWith(networkFirst(request, LIBRARY_CACHE));
    return;
  }
  if (url.pathname.startsWith(BASE + 'assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});

const post = (source, message) => {
  try {
    if (source && 'postMessage' in source) source.postMessage(message);
  } catch (error) {
    /* client gone */
  }
};

const countLibrary = async () => {
  const library = await caches.open(LIBRARY_CACHE);
  const core = await caches.open(CORE_CACHE);
  let cached = 0;
  for (const url of LIBRARY_URLS) {
    if ((await library.match(url)) || (await core.match(url))) cached += 1;
  }
  return cached;
};

const reportStatus = async (source) => {
  const cached = await countLibrary();
  post(source, { type: 'CACHE_STATUS', cached, total: LIBRARY_URLS.length, version: VERSION });
};

const cacheLibrary = async (source) => {
  const cache = await caches.open(LIBRARY_CACHE);
  const total = LIBRARY_URLS.length;
  let processed = 0;
  const queue = [...LIBRARY_URLS];

  post(source, { type: 'CACHE_PROGRESS', cached: 0, total });

  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const hit = await cache.match(url);
        if (!hit) {
          const response = await fetch(new Request(url, { cache: 'default' }));
          if (response && response.ok) await cache.put(url, response);
        }
      } catch (error) {
        /* offline or missing — try again next time */
      }
      processed += 1;
      if (processed % 20 === 0 || processed === total) {
        post(source, { type: 'CACHE_PROGRESS', cached: processed, total });
      }
    }
  };

  await Promise.all(Array.from({ length: 6 }, () => worker()));
  const cached = await countLibrary();
  post(source, { type: 'CACHE_STATUS', cached, total, version: VERSION, done: true });
};

self.addEventListener('message', (event) => {
  const data = event.data || {};
  const source = event.source;
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'GET_STATUS') {
    event.waitUntil(reportStatus(source));
    return;
  }
  if (data.type === 'CACHE_LIBRARY') {
    event.waitUntil(cacheLibrary(source));
  }
});
`;

await fs.writeFile(path.join(DIST, 'sw.js'), sw, 'utf8');

const bytes = Buffer.byteLength(sw);
console.log(
  `[sw] v${version} — ${unique(CORE_PATHS).length} core files, ${unique(LIBRARY_PATHS).length} library files (${(
    bytes / 1024
  ).toFixed(0)} KB)`
);
