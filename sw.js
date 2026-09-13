const BUILD = "81604fastfinal118";
const CACHE_PREFIX = "lucky-number-shell-";
const CACHE = `${CACHE_PREFIX}${BUILD}`;
// The cache build changes on every deploy. Assets remain in the existing release
// directory so an update can be published atomically without copying large bundles.
const RELEASE_BUILD = "81604fastfinal13";
const RELEASE = `./releases/${RELEASE_BUILD}/`;
const CORE = [
  "./index.html","./manifest.json","./version.json",
  `${RELEASE}style.css`,`${RELEASE}pro-core.js`,`${RELEASE}quality-core.js`,`${RELEASE}engine-registry.js`,`${RELEASE}auto-route.js`,
  `${RELEASE}app.js`,`${RELEASE}x4-native.js`,`${RELEASE}history-analysis-core.js`,`${RELEASE}hybrid-core.js`,`${RELEASE}x3-pro.js`,
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
    // V8.16.92 — stale-while-revalidate. V8.16.6's network-first strategy made every
    // single cold boot (which iOS forces on almost every reopen of a Home Screen PWA —
    // confirmed via the session-boot diagnostic) pay a full network round-trip for all 8
    // release JS files (app.js alone >1MB) before the app could even start, even when a
    // perfectly good cached copy already existed. Serve the cache immediately when present
    // (near-instant reopen), and refresh it in the background for the *next* reopen — this
    // still converges on new deploys, it just never makes the person wait for that check.
    const key=`./releases/${RELEASE_BUILD}/${url.pathname.split(`/releases/${RELEASE_BUILD}/`)[1]}`;
    event.respondWith((async()=>{
      const c = await caches.open(CACHE);
      const cached = await c.match(key);
      const revalidate = fetch(req,{cache:"no-store"}).then(r=>{
        if(r && r.ok) c.put(key,r.clone());
        return r;
      }).catch(()=>null);
      if(cached) { event.waitUntil(revalidate); return cached; }
      const fresh = await revalidate;
      return fresh || Response.error();
    })());
  }
});
