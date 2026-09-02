const BUILD = "81431pro7";
const CACHE_PREFIX = "lucky-number-shell-";
const CACHE = `${CACHE_PREFIX}${BUILD}`;
// The cache build changes on every deploy. Assets remain in the existing release
// directory so an update can be published atomically without copying large bundles.
const RELEASE_BUILD = "81431pro4";
const RELEASE = `./releases/${RELEASE_BUILD}/`;
const CORE = [
  "./index.html","./manifest.json","./version.json",
  `${RELEASE}style.css`,`${RELEASE}pro-core.js`,`${RELEASE}quality-core.js`,`${RELEASE}engine-registry.js`,`${RELEASE}auto-route.js`,
  `${RELEASE}app.js`,`${RELEASE}history-analysis-core.js`,`${RELEASE}hybrid-core.js`,`${RELEASE}x3-pro.js`,
  "./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./icons/favicon-32.png"
];
const fresh = (u) => fetch(`${u}${u.includes("?")?"&":"?"}b=${BUILD}`, {cache:"no-store"});
self.addEventListener("install", event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    // Precache best-effort. One transient asset failure must not strand an old iPhone build.
    await Promise.allSettled(CORE.map(async u=>{
      const r=await fresh(u); if(r && r.ok) await cache.put(u,r.clone());
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", event=>{ if(event.data?.type==="SKIP_WAITING") self.skipWaiting(); });
async function networkFreshIndex(req){
  try{
    const u=new URL(req.url); u.searchParams.set("appBuild",BUILD); u.searchParams.set("_shell",String(Date.now()));
    const r=await fetch(u.toString(),{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}});
    if(r&&r.ok){ const c=await caches.open(CACHE); await c.put("./index.html",r.clone()); return r; }
  }catch(_){}
  const c=await caches.open(CACHE); return (await c.match("./index.html")) || Response.error();
}
self.addEventListener("fetch", event=>{
  const req=event.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==self.location.origin) return;
  if(req.mode==="navigate"){ event.respondWith(networkFreshIndex(req)); return; }
  if(url.pathname.endsWith("/version.json") || url.pathname.endsWith("/sw.js") || url.pathname.endsWith("/manifest.json")){
    event.respondWith(fetch(req,{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store"}}).catch(()=>caches.match(req)));
    return;
  }
  if(url.pathname.includes(`/releases/${RELEASE_BUILD}/`)){
    event.respondWith(caches.open(CACHE).then(async c=>{
      const key=`./releases/${RELEASE_BUILD}/${url.pathname.split(`/releases/${RELEASE_BUILD}/`)[1]}`;
      const hit=await c.match(key); if(hit) return hit;
      const r=await fetch(req,{cache:"no-store"}); if(r&&r.ok) await c.put(key,r.clone()); return r;
    }));
  }
});
