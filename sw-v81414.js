const MIGRATION_BUILD = "81415proidlefastfix3";
const CACHE_PREFIX = "lucky-number-";
self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)).map(k=>caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({type:"window", includeUncontrolled:true});
    await Promise.all(clients.map(async client=>{
      try{
        const u = new URL(client.url);
        u.searchParams.set("appBuild", MIGRATION_BUILD);
        u.searchParams.set("_legacySwMigrate", String(Date.now()));
        await client.navigate(u.toString());
      }catch(_){}
    }));
  })());
});
self.addEventListener("message", event => {
  if(event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(req.mode === "navigate"){
    const fresh = new URL(req.url);
    fresh.searchParams.set("_migrate", MIGRATION_BUILD);
    fresh.searchParams.set("_t", String(Date.now()));
    event.respondWith(fetch(fresh.toString(), {cache:"no-store", headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}}));
    return;
  }
  if(url.pathname.endsWith("/version.json") || url.pathname.endsWith("/sw.js")){
    event.respondWith(fetch(req, {cache:"no-store"}));
  }
});
