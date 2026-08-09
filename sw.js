const CACHE = "lucky-number-v6-9-11-smooth-turbo-20260809";
const ASSETS = ["./", "./index.html", "./style.css", "./app.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(cached => {
    const refresh = fetch(e.request).then(response => {
      if (response && response.ok) caches.open(CACHE).then(c => c.put(e.request, response.clone()));
      return response;
    }).catch(() => null);
    // V6.9.11: return cached app shell immediately; refresh it in the background.
    if (cached) { e.waitUntil(refresh); return cached; }
    return refresh.then(r => r || caches.match("./index.html"));
  }));
});
