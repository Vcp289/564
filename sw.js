const BUILD = '81604fastfinal134';
const CACHE_PREFIX = 'lucky-number-shell-';
const CACHE = CACHE_PREFIX + BUILD;
const RELEASE = `./releases/${BUILD}/`;
const CORE = ['./index.html', './manifest.json', ...[
  'style.css', 'pro-core.js', 'quality-core.js', 'engine-registry.js',
  'auto-route.js', 'app.js', 'x4-native.js', 'history-analysis-core.js',
  'hybrid-core.js', 'x3-pro.js', 'pwa-update.js'
].map(name => RELEASE + name)];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Atomic installation: failure leaves the existing worker and cache usable.
    const responses = await Promise.all(CORE.map(async path => {
      const response = await fetch(path, {cache:'reload'});
      if (!response.ok) throw new Error(`Cannot cache ${path}: ${response.status}`);
      if (path === './index.html' && !(await response.clone().text()).includes(`data-app-build="${BUILD}"`))
        throw new Error('Deployment shell/build mismatch');
      return response;
    }));
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map((path, i) => cache.put(path, responses[i])));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  // Keep prior release caches for older open tabs / delayed script loads.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_BUILD') event.ports[0]?.postMessage({build:BUILD});
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(req, {cache:'no-store'})); return;
  }
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return await cache.match('./index.html') || fetch(req);
    })());
    return;
  }
  const base = new URL('./', self.location.href);
  if (url.pathname.startsWith(base.pathname + 'releases/') || url.pathname === base.pathname + 'manifest.json') {
    url.search = '';
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(url.href) || await caches.match(url.href);
      if (cached) return cached;
      const response = await fetch(req);
      if (response.ok) await cache.put(url.href, response.clone());
      return response;
    })());
  }
});
