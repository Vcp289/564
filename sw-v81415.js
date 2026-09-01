const TARGET_BUILD="81419masterstable1";
self.addEventListener("install",e=>e.waitUntil(self.skipWaiting()));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  // Do not touch localStorage/IndexedDB. Clear only old HTTP CacheStorage generations.
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>/^lucky-number-/i.test(k)).map(k=>caches.delete(k)));
  await self.clients.claim();
  const list=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  await Promise.all(list.map(async client=>{
    try{const u=new URL(client.url);u.searchParams.set("appBuild",TARGET_BUILD);u.searchParams.set("_from81405",String(Date.now()));await client.navigate(u.toString());}catch(_){}
  }));
})()));
self.addEventListener("message",e=>{if(e.data?.type==="SKIP_WAITING")self.skipWaiting();});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  if(r.mode==="navigate"){
    const n=new URL(r.url);n.searchParams.set("appBuild",TARGET_BUILD);n.searchParams.set("_legacy",String(Date.now()));
    e.respondWith(fetch(n.toString(),{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}}));
  } else if(u.pathname.endsWith('/version.json')||u.pathname.endsWith('/sw.js')) e.respondWith(fetch(r,{cache:'no-store'}));
});
