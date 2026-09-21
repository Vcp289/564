const BUILD="81604fastfinal199";
const CACHE_PREFIX="lucky-number-shell-";
const CACHE=`${CACHE_PREFIX}${BUILD}`;
const RELEASE_BUILD="81604fastfinal13";
const RELEASE=`./releases/${RELEASE_BUILD}/`;
const CORE=[
"./index.html","./manifest.json","./version.json",
`${RELEASE}style.css`,`${RELEASE}pro-core.js`,`${RELEASE}quality-core.js`,`${RELEASE}engine-registry.js`,`${RELEASE}auto-route.js`,
`${RELEASE}app.js`,`${RELEASE}x4-native.js`,`${RELEASE}history-analysis-core.js`,`${RELEASE}hybrid-core.js`,`${RELEASE}x3-pro.js`,
"./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./icons/favicon-32.png"
];
const okType=(u,r)=>{const t=(r.headers.get("content-type")||"").toLowerCase();const p=u.split("?")[0];
if(p.endsWith(".css"))return t.includes("css");
if(p.endsWith(".js"))return t.includes("javascript")||t.includes("ecmascript");
return true;};
const fresh=(u)=>fetch(`${u}${u.includes("?")?"&":"?"}b=${BUILD}`,{cache:"no-store"});
self.addEventListener("install",event=>{
event.waitUntil((async()=>{
const cache=await caches.open(CACHE);
await Promise.allSettled(CORE.map(async u=>{
const r=await fresh(u);if(r&&r.ok&&okType(u,r))await cache.put(u,r.clone());
}));
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
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting();});
async function shellIndex(req,event){
const c=await caches.open(CACHE);
const cached=await c.match("./index.html");
const update=(async()=>{
try{
const u=new URL(req.url);u.searchParams.set("appBuild",BUILD);
const r=await fetch(u.toString(),{cache:"no-cache"});
if(r&&r.ok){await c.put("./index.html",r.clone());return r;}
}catch(_){}
return null;
})();
if(cached){event.waitUntil(update);return cached;}
return (await update)||Response.error();
}
self.addEventListener("fetch",event=>{
const req=event.request;if(req.method!=="GET")return;
const url=new URL(req.url);if(url.origin!==self.location.origin)return;
if(req.mode==="navigate"){event.respondWith(shellIndex(req,event));return;}
if(url.pathname.endsWith("/version.json")||url.pathname.endsWith("/sw.js")||url.pathname.endsWith("/manifest.json")){
event.respondWith(fetch(req,{cache:"no-store",headers:{"Cache-Control":"no-cache, no-store"}}).catch(()=>caches.match(req)));
return;
}
if(url.pathname.includes(`/releases/${RELEASE_BUILD}/`)){
const key=`./releases/${RELEASE_BUILD}/${url.pathname.split(`/releases/${RELEASE_BUILD}/`)[1]}`;
event.respondWith((async()=>{
const c=await caches.open(CACHE);
const cached=await c.match(key);
if(cached&&okType(key,cached))return cached;
const r=await fetch(req,{cache:"no-cache"}).catch(()=>null);
if(r&&r.ok&&okType(key,r))c.put(key,r.clone());
return r||Response.error();
})());
}
});
