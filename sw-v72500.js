const TARGET_BUILD="72504permanentpwa";
const CACHE_PREFIX="lucky-number-";
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)).map(k=>caches.delete(k)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of clients){
      try{
        const u=new URL(client.url); u.searchParams.set("appBuild",TARGET_BUILD); u.searchParams.set("__legacy_migrate",Date.now().toString());
        await client.navigate(u.toString());
      }catch(_){ }
    }
  })());
});
self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch",event=>{
  const r=event.request; if(r.method!=="GET") return;
  const u=new URL(r.url); if(u.origin!==self.location.origin) return;
  if(r.mode==="navigate"){
    const n=new URL(r.url); n.searchParams.set("appBuild",TARGET_BUILD); n.searchParams.set("__legacy",Date.now().toString());
    event.respondWith(fetch(n.toString(),{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}}));
    return;
  }
  event.respondWith(fetch(r,{cache:"no-store",headers:{"Cache-Control":"no-cache"}}).catch(()=>Response.error()));
});
