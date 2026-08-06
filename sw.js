// V5.4.2 intentionally disables offline caching to prevent stale iPhone PWA blank screens.
self.addEventListener("install", event => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", () => {});
