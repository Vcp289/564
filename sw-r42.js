const CACHE = "lucky-number-v7-20-28-x2-nested-pro-463-20260823";
const CACHE_PREFIX = "lucky-number-";
const ASSETS = [
  "./",
  "./index.html",
  "./style-r42.css?v=72028pro463",
  "./app-r42.js?v=72028pro463",
  "./x2-pro-r43.js?v=72028pro463",
  "./manifest.json?v=72028pro463",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => { if(event.data?.type === "SKIP_WAITING") self.skipWaiting(); });
async function staleWhileRevalidate(request, fallback){
  const cache=await caches.open(CACHE);
  const cached=(await cache.match(request)) || (fallback ? await cache.match(fallback) : null);
  const update=fetch(request,{cache:"no-store"}).then(response=>{
    if(response && response.ok) cache.put(request,response.clone()).catch(()=>{});
    return response;
  }).catch(()=>null);
  if(cached){ update.catch(()=>{}); return cached; }
  return (await update) || (fallback ? await cache.match(fallback) : null) || Response.error();
}
self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const url=new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  if(event.request.mode === "navigate"){
    event.respondWith(staleWhileRevalidate(event.request,"./index.html"));
    return;
  }
  const isVersionedShell = /(?:app-r42\.js|x2-pro-r43\.js|style-r42\.css|manifest\.json)$/.test(url.pathname);
  if(isVersionedShell){
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if(response && response.ok){ const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(event.request,copy)).catch(()=>{}); }
    return response;
  })));
});
