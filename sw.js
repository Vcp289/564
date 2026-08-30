const BUILD = "72519smartincremental";
const CACHE = `lucky-number-${BUILD}`;
const CACHE_PREFIX = "lucky-number-";
const SHELL = [
  "./index.html",
  "./style-v72515.css",
  "./pro-core-v72515.js",
  "./app-v72515.js",
  "./x3-pro-v72515.js",
  "./manifest-v72515.json",
  "./version.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];
const IMMUTABLE = /(?:style-v72515\.css|pro-core-v72515\.js|app-v72515\.js|x3-pro-v72515\.js|manifest-v72515\.json)$/;

function freshUrl(url){
  const u=new URL(url,self.location.href);
  u.searchParams.set("__build",BUILD);
  return u.toString();
}
async function fetchFresh(url){
  return fetch(freshUrl(url),{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}});
}
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const url of SHELL){
      const response=await fetchFresh(url);
      if(!response||!response.ok) throw new Error(`Shell install failed: ${url}`);
      await cache.put(url,response.clone());
    }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING") self.skipWaiting();
  if(event.data?.type==="CHECK_UPDATE") event.waitUntil(self.registration.update().catch(()=>{}));
});
async function networkFirstNavigation(request){
  const cache=await caches.open(CACHE);
  try{
    const u=new URL(request.url); u.searchParams.set("__nav",Date.now().toString()); u.searchParams.set("appBuild",BUILD);
    const response=await fetch(u.toString(),{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache"}});
    if(response&&response.ok){
      const probe=await response.clone().text();
      if(probe.includes(`data-app-build="${BUILD}"`)||probe.includes(`data-app-build='${BUILD}'`)) await cache.put("./index.html",response.clone());
      return response;
    }
  }catch(_){ }
  return (await cache.match("./index.html"))||Response.error();
}
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET") return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;
  if(request.mode==="navigate") { event.respondWith(networkFirstNavigation(request)); return; }
  if(url.pathname.endsWith("/version.json")) {
    event.respondWith(fetchFresh("./version.json").catch(()=>caches.open(CACHE).then(c=>c.match("./version.json")))); return;
  }
  if(IMMUTABLE.test(url.pathname)){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const name=url.pathname.split('/').pop();
      const hit=await cache.match(`./${name}`); if(hit) return hit;
      return fetch(request,{cache:"no-store"});
    })); return;
  }
  event.respondWith(fetch(request,{cache:"no-store"}).catch(()=>caches.match(request)));
});
