const CACHE = "lucky-number-v7-09-27-score-clean-details-20260818";
const CACHE_PREFIX = "lucky-number-";
const ASSETS = [
  "./",
  "./index.html",
  "./style-r23.css?v=70927scoreclean",
  "./app-r28.js?v=70927scoreclean",
  "./manifest.json?v=70927scoreclean",
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

self.addEventListener("message", event => {
  if(event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request, fallback){
  const cache=await caches.open(CACHE);
  try{
    const fresh=await fetch(request,{cache:"no-store"});
    if(fresh && fresh.ok) cache.put(request,fresh.clone()).catch(()=>{});
    return fresh;
  }catch(_){
    return (await caches.match(request)) || (fallback ? await caches.match(fallback) : undefined) || Response.error();
  }
}

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const url=new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  if(event.request.mode === "navigate"){
    event.respondWith(networkFirst(event.request,"./index.html"));
    return;
  }
  const isAppShell = /(?:index\.html|app-r28\.js|style-r23\.css|manifest\.json|sw-r28\.js)$/.test(url.pathname);
  if(isAppShell){
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if(response && response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request,copy)).catch(()=>{});
    }
    return response;
  })));
});
