// V4.8.4: service worker intentionally disabled to prevent stale cache.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.registration.unregister()));
