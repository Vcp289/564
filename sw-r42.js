// V7.20.14 iOS migration bridge.
// IMPORTANT: keep this filename because V7.20.12 iPhone/PWA clients already poll sw-r42.js.
const CACHE = "lucky-number-v7-20-14-ios-migration-fast-boot-20260822";
const CACHE_PREFIX = "lucky-number-";
const ASSETS = [
  "./",
  "./index.html",
  "./style-r44.css?v=72014migration",
  "./app-r44.js?v=72014migration",
  "./manifest.json?v=72014migration",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    // Remove only LuckyNumber app-shell caches. Never touch localStorage or IndexedDB.
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();

    // V7.20.12 has no listener for the new migration message. Force one safe navigation
    // after this worker activates so an installed iPhone PWA actually receives index V7.20.14.
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(clients.map(async client => {
      try {
        const u = new URL(client.url);
        if (u.origin !== self.location.origin) return;
        u.searchParams.set("ln_migrate", "72014");
        await client.navigate(u.toString());
      } catch (_) {}
    }));
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request, fallback){
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(()=>{});
    return fresh;
  } catch (_) {
    return (await caches.match(request)) ||
      (fallback ? await caches.match(fallback) : undefined) ||
      Response.error();
  }
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, "./index.html"));
    return;
  }

  // Recognize both legacy and current shell names during migration.
  const isAppShell = /(?:index\.html|app-r4[234]\.js|style-r4[234]\.css|manifest\.json|sw-r4[234]\.js)$/.test(url.pathname);
  if (isAppShell) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(()=>{});
    }
    return response;
  })));
});
