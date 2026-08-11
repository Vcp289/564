const CACHE = "lucky-number-v6-10-5-behavior-ranking-20260811";
const ASSETS = ["./", "./index.html", "./style.css?v=6105", "./app.js?v=6105", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation stays network-first so a new deploy is discovered quickly.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put("./index.html", copy)).catch(() => {});
        return response;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Core UI files are network-first so Home Screen picks up a new deploy immediately.
  // Cache Storage is only an offline fallback; app data in localStorage/IndexedDB is untouched.
  const isCoreUI = /\/(?:app\.js|style\.css)$/.test(url.pathname);
  if (isCoreUI) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Icons/manifest stay cache-first for fast startup.
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    }))
  );
});
