const CACHE = "lucky-number-v7-20-72-ai-center-responsive-20260826";
const CACHE_PREFIX = "lucky-number-";
const ASSETS = [
  "./",
  "./index.html",
  "./style-r42.css?v=72072aicenterresponsive",
  "./pro-core-r44.js?v=72072aicenterresponsive",
  "./app-r42.js?v=72072aicenterresponsive",
  "./x3-pro-r43.js?v=72072aicenterresponsive",
  "./manifest.json?v=72072aicenterresponsive",
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
async function networkFirstNavigation(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(response && response.ok){ cache.put("./index.html",response.clone()).catch(()=>{}); return response; }
  }catch(_){}
  return (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
}
self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const url=new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  if(event.request.mode === "navigate"){
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }
  const isVersionedShell = /(?:pro-core-r44\.js|app-r42\.js|x3-pro-r43\.js|style-r42\.css|manifest\.json)$/.test(url.pathname);
  if(isVersionedShell){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(event.request,{cache:"no-store"});
        if(response&&response.ok){ cache.put(event.request,response.clone()).catch(()=>{}); return response; }
      }catch(_){}
      return (await cache.match(event.request)) || Response.error();
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if(response && response.ok){ const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(event.request,copy)).catch(()=>{}); }
    return response;
  })));
});
