const BUILD = "72084cleanproduction";
const CACHE = `lucky-number-${BUILD}`;
const CACHE_PREFIX = "lucky-number-";
const SHELL = [
  "./index.html",
  "./style-v72084.css",
  "./pro-core-v72084.js",
  "./app-v72084.js",
  "./x3-pro-v72084.js",
  "./manifest-v72084.json",
  "./version.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

async function fetchFresh(url){
  return fetch(`${url}${url.includes("?")?"&":"?"}b=${BUILD}`,{cache:"no-store"});
}

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Install is accepted only when every required shell file for THIS build is reachable.
    for(const url of SHELL){
      const response=await fetchFresh(url);
      if(!response || !response.ok) throw new Error(`Shell install failed: ${url}`);
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
});

async function networkFirstNavigation(request){
  const cache=await caches.open(CACHE);
  try{
    const url=new URL(request.url);
    url.searchParams.set("_nav",Date.now().toString());
    const response=await fetch(url.toString(),{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store"}});
    if(response&&response.ok){
      // Never poison the offline shell with an HTML document from another published build.
      const copy=response.clone();
      const text=await copy.text();
      if(text.includes(`data-app-build="${BUILD}"`)||text.includes(`data-app-build='${BUILD}'`)){
        await cache.put("./index.html",response.clone());
      }
      return response;
    }
  }catch(_){}
  return (await cache.match("./index.html"))||Response.error();
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET") return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(request.mode==="navigate"){
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if(url.pathname.endsWith("/version.json")){
    event.respondWith(fetch(`${url.pathname}?t=${Date.now()}`,{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store"}})
      .catch(()=>caches.open(CACHE).then(c=>c.match("./version.json"))));
    return;
  }

  // Build-specific filenames are immutable: cache-first is both fastest and safe from cross-version mixing.
  const immutable = /(?:style-v72084\.css|pro-core-v72084\.js|app-v72084\.js|x3-pro-v72084\.js|manifest-v72084\.json)$/.test(url.pathname);
  if(immutable){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const hit=await cache.match(url.pathname.split('/').pop().startsWith('manifest')?'./manifest-v72084.json':
        url.pathname.endsWith('style-v72084.css')?'./style-v72084.css':
        url.pathname.endsWith('pro-core-v72084.js')?'./pro-core-v72084.js':
        url.pathname.endsWith('app-v72084.js')?'./app-v72084.js':'./x3-pro-v72084.js');
      if(hit) return hit;
      return fetch(request,{cache:"no-store"});
    }));
    return;
  }

  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy)).catch(()=>{});}
    return response;
  })));
});
