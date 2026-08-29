/* LuckyNumber V7.23.00 — NEW Canonical History/Analysis Core
 * Parallel runtime: does NOT overwrite legacy AI History stores.
 * Source of truth for derived engine results is this new canonical store only.
 */
(() => {
  'use strict';
  const SCHEMA='LN-CANONICAL-ENGINE-STORE-V1';
  const KEY='luckyNumber_canonical_engine_store_v72300';
  const ENGINES=['classic','aiL','gl','p18','p19','x3'];
  const READY=new Set(['exact','reversed','swap','miss']);
  const RUNNING=new Map();
  let mem=null, rawMem='';

  function safeParse(raw){ try{return JSON.parse(raw)||{};}catch(_){return {};} }
  function load(){
    try{
      const raw=localStorage.getItem(KEY)||'';
      if(mem && raw===rawMem) return mem;
      const parsed=safeParse(raw);
      if(parsed.schema!==SCHEMA) return {schema:SCHEMA,profiles:{},updatedAt:0};
      mem=parsed; rawMem=raw; return parsed;
    }catch(_){ return mem||{schema:SCHEMA,profiles:{},updatedAt:0}; }
  }
  function save(store){
    try{
      const next={...store,schema:SCHEMA,updatedAt:Date.now()};
      const raw=JSON.stringify(next); localStorage.setItem(KEY,raw); mem=next; rawMem=raw; return true;
    }catch(e){ console.warn('[V7.23 canonical] persist failed',e); return false; }
  }
  function normDate(v){ const s=String(v||'').slice(0,10); return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''; }
  function pkey(id){ return String(Number(id)||0); }
  function rowKey(draw){ return normDate(draw?.date); }
  function cleanStatus(v){ const s=String(v||'pending'); return READY.has(s)?s:'pending'; }
  function profileStore(store,id){
    const k=pkey(id), prev=store.profiles?.[k]||{};
    return {k,value:{profileId:Number(id)||0,rows:{...(prev.rows||{})},updatedAt:Number(prev.updatedAt||0)}};
  }
  function mergeRow(profile,draw,statuses,source='runtime'){
    const date=rowKey(draw); if(!date) return false;
    const prev=profile.rows[date]||{date,drawId:String(draw?.id||''),engines:{}};
    const engines={...(prev.engines||{})}; let changed=false;
    for(const e of ENGINES){
      const next=cleanStatus(statuses?.[e]);
      // Never downgrade a verified value back to pending.
      if(next!=='pending' && engines[e]!==next){ engines[e]=next; changed=true; }
    }
    if(String(prev.drawId||'')!==String(draw?.id||'')){ changed=true; }
    if(changed || !profile.rows[date]) profile.rows[date]={date,drawId:String(draw?.id||''),engines,source,updatedAt:Date.now()};
    return changed;
  }
  function getProfileDraws(id){
    try{return (state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===Number(id)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.createdAt||0)-Number(b.createdAt||0));}
    catch(_){return [];}
  }
  function directStatuses(draw,id){
    let s={};
    try{s=getHistoryRouteAStatuses(draw,id,{display:true})||{};}catch(_){ }
    return Object.fromEntries(ENGINES.map(e=>[e,cleanStatus(s?.[e]) ]));
  }
  function importLegacyReady(profileId,draws){
    try{
      if(typeof __LN_LEGACY_READ_EXACT!=='function' && typeof __LN_LEGACY_READ_LATEST!=='function') return false;
      const legacy=(typeof __LN_LEGACY_READ_EXACT==='function'?__LN_LEGACY_READ_EXACT(profileId,draws):null) || (typeof __LN_LEGACY_READ_LATEST==='function'?__LN_LEGACY_READ_LATEST(profileId):null);
      if(!legacy?.rows) return false;
      const store=load(), {k,value}=profileStore(store,profileId); let changed=false;
      for(const draw of draws){ const lr=legacy.rows?.[String(draw?.id??`${draw?.date||''}|${draw?.number||''}`)]; if(lr) changed=mergeRow(value,draw,lr,'legacy-import')||changed; }
      if(changed){ const next={...store,profiles:{...(store.profiles||{}),[k]:{...value,updatedAt:Date.now()}}}; save(next); }
      return changed;
    }catch(_){return false;}
  }
  function snapshot(profileId,draws=getProfileDraws(profileId)){
    const id=Number(profileId)||0; importLegacyReady(id,draws);
    const store=load(), profile=store.profiles?.[pkey(id)]||{rows:{}};
    const rows={}; const hit=Object.fromEntries(ENGINES.map(e=>[e,0])); const total=Object.fromEntries(ENGINES.map(e=>[e,0])); const pend=Object.fromEntries(ENGINES.map(e=>[e,0]));
    let trusted=0;
    for(const draw of draws){
      const date=rowKey(draw), cr=profile.rows?.[date]; const engines={};
      let any=false;
      for(const e of ENGINES){ const st=cleanStatus(cr?.engines?.[e]); engines[e]=st; if(st==='pending') pend[e]++; else {total[e]++; any=true; if(st==='exact'||st==='reversed'||st==='swap') hit[e]++;} }
      if(any) trusted++;
      rows[String(draw?.id??`${draw?.date||''}|${draw?.number||''}`)]=engines;
    }
    const summaries=Object.fromEntries(ENGINES.map(e=>[e,{hit:hit[e],total:total[e],rate:total[e]?Math.round(hit[e]*1000/total[e])/10:0,pending:pend[e]}]));
    const pendingThreshold=Math.max(3,Math.min(8,Math.floor(draws.length*0.04)));
    const repairEngines=ENGINES.filter(e=>draws.length>=3 && pend[e]>pendingThreshold);
    return {schema:SCHEMA,profileId:id,rows,summaries,trusted,pending:Object.values(pend).reduce((a,b)=>a+b,0),pendingByEngine:pend,repairEngines,needsRepair:repairEngines.length>0,complete:repairEngines.length===0 && Object.values(pend).every(v=>v===0),generation:`canonical-${Number(profile?.updatedAt||store.updatedAt||0)}`};
  }

  async function maybeAdvanceWF(id){
    try{
      if(typeof walkForwardBucketCoversCurrentHistory==='function' && walkForwardBucketCoversCurrentHistory(id)) return false;
      if(typeof nextWalkForwardRepairStartDate!=='function' || typeof rebuildWalkForwardBacktest!=='function') return false;
      const start=nextWalkForwardRepairStartDate(id); if(!start) return false;
      await rebuildWalkForwardBacktest(id,null,{startDate:start,fastEvolution:true,yieldEvery:4,progressEvery:4,maxRows:12,mutationScope:true});
      return true;
    }catch(e){ console.warn('[V7.23 canonical] WF advance skipped',id,e); return false; }
  }
  async function hydrateProfile(profileId,{full=false}={}){
    const id=Number(profileId)||0;
    if(RUNNING.has(id)) return RUNNING.get(id);
    const job=(async()=>{
      const draws=getProfileDraws(id); if(!draws.length) return snapshot(id,draws);
      importLegacyReady(id,draws);
      // newest first gives visible History useful data immediately.
      const ordered=[...draws].reverse();
      let cursor=0, rounds=0;
      while(cursor<ordered.length){
        const store=load(), {k,value}=profileStore(store,id); let changed=false;
        const chunk=ordered.slice(cursor,cursor+8);
        for(const draw of chunk){ changed=mergeRow(value,draw,directStatuses(draw,id),'direct-route')||changed; }
        if(changed) save({...store,profiles:{...(store.profiles||{}),[k]:{...value,updatedAt:Date.now()}}});
        cursor+=chunk.length;
        if(typeof window!=='undefined') window.dispatchEvent(new CustomEvent('ln-canonical-history-update',{detail:{profileId:id}}));
        await new Promise(r=>setTimeout(r,0));
        if(!full && cursor>=48) break; // first pass: visible rows only
      }
      let snap=snapshot(id,draws);
      // If CLS/AIL/GL/P18 are still missing, advance the producer in bounded chunks,
      // then re-evaluate and commit through the NEW store. No legacy snapshot dependency.
      while(snap.needsRepair && rounds<24 && document.visibilityState!=='hidden'){
        rounds++;
        const advanced=await maybeAdvanceWF(id);
        try{ if(typeof warmUnifiedP18ProfileCache==='function') await warmUnifiedP18ProfileCache(id); }catch(_){ }
        const store=load(), {k,value}=profileStore(store,id); let changed=false;
        for(const draw of draws){ changed=mergeRow(value,draw,directStatuses(draw,id),'producer-refresh')||changed; }
        if(changed) save({...store,profiles:{...(store.profiles||{}),[k]:{...value,updatedAt:Date.now()}}});
        snap=snapshot(id,draws);
        if(!advanced && !changed) break;
        window.dispatchEvent(new CustomEvent('ln-canonical-history-update',{detail:{profileId:id}}));
        await new Promise(r=>setTimeout(r,80));
      }
      return snap;
    })().finally(()=>RUNNING.delete(id));
    RUNNING.set(id,job); return job;
  }
  function schedule(id,delay=80,full=false){
    setTimeout(()=>{ if(document.visibilityState!=='hidden') hydrateProfile(id,{full}).then(()=>{ try{ if(Number(state.activeProfile)===Number(id) && (state.currentView==='history'||state.currentView==='analysis')) refreshCurrentView(); }catch(_){}; }); },Math.max(0,Number(delay)||0));
    return true;
  }

  // Preserve legacy functions under private aliases, then redirect consumers to the NEW core.
  window.__LN_LEGACY_READ_EXACT=window.readCommittedAIHistorySnapshot;
  window.__LN_LEGACY_READ_LATEST=window.readLatestCommittedAIHistorySnapshot;
  window.__LN_LEGACY_PERSIST=window.persistCommittedAIHistorySnapshot;
  window.__LN_LEGACY_TX=window.runAIHistoryTransaction;

  window.readCommittedAIHistorySnapshot=(profileId,draws)=>snapshot(profileId,Array.isArray(draws)?draws:getProfileDraws(profileId));
  window.readLatestCommittedAIHistorySnapshot=(profileId)=>snapshot(profileId,getProfileDraws(profileId));
  window.aiHistorySnapshotNeedsRepair=(snap)=>Boolean(snap?.needsRepair);
  window.persistCommittedAIHistorySnapshot=(profileId,draws,legacySnap)=>{
    // Import only verified legacy values into the NEW store; never write back to old storage.
    try{
      const store=load(), {k,value}=profileStore(store,profileId); let changed=false;
      for(const draw of (Array.isArray(draws)?draws:[])){ const r=legacySnap?.rows?.[String(draw?.id??`${draw?.date||''}|${draw?.number||''}`)]; if(r) changed=mergeRow(value,draw,r,'legacy-bridge')||changed; }
      if(changed) save({...store,profiles:{...(store.profiles||{}),[k]:{...value,updatedAt:Date.now()}}});
      return true;
    }catch(_){return false;}
  };
  window.buildCommittedAIHistorySnapshot=(profileId,draws)=>snapshot(profileId,Array.isArray(draws)?draws:getProfileDraws(profileId));
  window.runAIHistoryTransaction=async(profileId,reason='mutation',options={})=>{
    const id=Number(profileId)||0;
    // Fast foreground commit from direct prior-only evidence; heavy producer work continues bounded.
    await hydrateProfile(id,{full:false});
    schedule(id,120,true);
    return snapshot(id,getProfileDraws(id));
  };
  if(typeof window.scheduleHistoryDerivedSelfHeal==='function'){
    window.scheduleHistoryDerivedSelfHeal=(profileId,_startDate,delay=120)=>schedule(profileId,delay,true);
  }

  window.LNCanonicalHistory={schema:SCHEMA,key:KEY,snapshot,hydrateProfile,schedule,load};
  window.addEventListener('ln-canonical-history-update',()=>{});
  // First launch: hydrate active profile without blocking initial paint.
  setTimeout(()=>{ try{ schedule(Number(state.activeProfile)||0,150,false); }catch(_){} },150);
})();
