/* LuckyNumber V8.14.31.12 — AUTO reads Analysis Champion only
 * Calculator never recalculates History/Ranking/Hit/Rev/percentages.
 * One authority: the same committed/cached Prior-only summaries used by Analysis > Champion & Ranking.
 * One Profile + one target date = immutable Daily Lock.
 */
(function(global){
  'use strict';

  const ENGINE_VERSION='AUTO_ANALYSIS_CHAMPION_8143112';
  const LOCK_KEY='luckyNumber_auto_analysis_champion_8143112';

  const round1=n=>Math.round((Number(n)||0)*10)/10;
  const shortName=k=>k==='pattern'?'P18':k==='original'?'CLS':k==='ai'?'AIL':k==='gl'?'GL':String(k||'').toUpperCase();
  const fullName=k=>k==='pattern'?'P18':k==='original'?'Classic':k==='ai'?'AI L':k==='gl'?'AI GL':String(k||'').toUpperCase();
  const toMode=k=>k==='classic'?'original':k==='p18'?'pattern':k==='aiL'?'ai':String(k||'original');

  function safeJSON(raw,fallback){ try{return JSON.parse(raw);}catch(_){return fallback;} }
  function loadBox(){
    const box=safeJSON(localStorage.getItem(LOCK_KEY)||'null',null);
    return box&&box.schema===1&&box.engineVersion===ENGINE_VERSION?box:{schema:1,engineVersion:ENGINE_VERSION,dates:{}};
  }
  function readLock(targetDate,profileId){
    try{
      const item=loadBox()?.dates?.[String(targetDate)]?.[String(Number(profileId))];
      if(!item||item.engineVersion!==ENGINE_VERSION) return null;
      if(String(item.targetDate)!==String(targetDate)||Number(item.profileId)!==Number(profileId)) return null;
      return item.decision||null;
    }catch(_){return null;}
  }
  function writeLock(targetDate,profileId,decision){
    try{
      const box=loadBox(),date=String(targetDate),pid=String(Number(profileId));
      box.dates[date]=box.dates[date]||{};
      box.dates[date][pid]={engineVersion:ENGINE_VERSION,targetDate:date,profileId:Number(profileId),createdAt:Date.now(),decision};
      const dates=Object.keys(box.dates).sort();
      while(dates.length>21) delete box.dates[dates.shift()];
      localStorage.setItem(LOCK_KEY,JSON.stringify(box));
    }catch(_){/* lock persistence must never block Calculator */}
    return decision;
  }

  // Exact same snapshot authority used by renderAnalysisModelPerformance().
  // IMPORTANT: no trustedHistorySummary(), no WF rebuild, no Hit/Rev scan, no 7/14/30 recomputation here.
  function readAnalysisChampionAuthority(profileId){
    const id=Number(profileId);
    try{
      const draws=(state.actualDraws||[]).filter(r=>Number(r?.profileId??0)===id);
      try{ restoreUnifiedAIProfileSync(id); }catch(_){ }
      const exactCommitted=readCommittedAIHistorySnapshot(id,draws);
      const committed=exactCommitted||readLatestCommittedAIHistorySnapshot(id);
      const cached=readHistorySummaryCache(id,draws);
      const s=exactCommitted?.summaries||cached?.summaries||committed?.summaries||{};
      const pending={hit:0,total:0,rate:0,pending:true};
      const classic=s?.classic||pending, aiL=s?.aiL||pending, gl=s?.gl||pending;
      const p18=s?.p18||pending;
      const p19=s?.p19||PERF_CACHE.patternV19Bundle.get(p19BundleCacheKey(id))?.summary||state.p19PrimaryCache?.[id]?.summary||pending;
      const x3=s?.x3||PERF_CACHE.x3Bundle.get(x3BundleCacheKey(id))?.summary||pending;
      const champion=buildHistoryChampionSummary(classic,aiL,gl,null,p18,p19,x3,null);
      const winner=champion?.winner||null;
      if(!winner?.summary || Number(winner.summary.total||0)<=0) return {ready:false,champion:null,items:champion?.items||[]};
      return {ready:true,champion:winner,items:champion?.items||[]};
    }catch(error){
      console.error('AUTO Analysis Champion authority unavailable',error);
      return {ready:false,champion:null,items:[]};
    }
  }

  function decide(profileId){
    const id=Number(profileId),targetDate=autoRouteTargetDate();
    const locked=readLock(targetDate,id);
    if(locked) return {...locked,locked:true,lockReused:true};

    const authority=readAnalysisChampionAuthority(id);
    const winner=authority.champion;
    if(!authority.ready||!winner){
      return {
        selectorVersion:ENGINE_VERSION,targetDate,profileId:id,strictPriorOnly:true,
        evidenceSource:'ANALYSIS_CHAMPION_SNAPSHOT',mode:'original',ready:false,hydrating:true,
        locked:false,provisional:true,confidenceLabel:'WAIT ANALYSIS',candidatePool:[],
        classicRate:0,aiRate:0,glRate:0,p18Rate:0,p19Rate:0,x3Rate:0,
        reason:'รอ Champion & Ranking จาก Analysis • Calculator ไม่คำนวณใหม่'
      };
    }

    const mode=toMode(winner.key);
    const rates={classicRate:0,aiRate:0,glRate:0,p18Rate:0,p19Rate:0,x3Rate:0};
    const samples={classicTrustedAll:0,aiTrustedAll:0,glTrustedAll:0,p18Samples:0,p19Samples:0,x3Samples:0};
    const pool=[];
    for(const item of authority.items||[]){
      const m=toMode(item?.key),r=round1(item?.summary?.rate),t=Number(item?.summary?.total||0);
      pool.push(m);
      if(m==='original'){rates.classicRate=r;samples.classicTrustedAll=t;}
      else if(m==='ai'){rates.aiRate=r;samples.aiTrustedAll=t;}
      else if(m==='gl'){rates.glRate=r;samples.glTrustedAll=t;}
      else if(m==='pattern'){rates.p18Rate=r;samples.p18Samples=t;}
      else if(m==='p19'){rates.p19Rate=r;samples.p19Samples=t;}
      else if(m==='x3'){rates.x3Rate=r;samples.x3Samples=t;}
    }

    const decision={
      selectorVersion:ENGINE_VERSION,targetDate,profileId:id,strictPriorOnly:true,
      evidenceSource:'ANALYSIS_CHAMPION_SNAPSHOT',mode,ready:true,hydrating:false,
      locked:true,provisional:false,confidenceLabel:'ANALYSIS CHAMPION',
      championRate:round1(winner.summary.rate),championHit:Number(winner.summary.hit||0),championTotal:Number(winner.summary.total||0),
      candidatePool:pool,...rates,...samples,
      reason:`Analysis Champion • ${fullName(mode)} • ${round1(winner.summary.rate).toFixed(1)}% • ${Number(winner.summary.hit||0)}/${Number(winner.summary.total||0)} • Daily Lock`
    };
    return writeLock(targetDate,id,decision);
  }

  function formatUi(profileId,decision){
    const d=decision||decide(profileId);
    if(!d?.ready){
      return {mode:'pending',badge:'AUTO • WAIT ANALYSIS',detail:'รอ Champion & Ranking จาก Analysis • Calculator ไม่คำนวณใหม่',button:'AUTO • WAIT'};
    }
    const mode=String(d.mode||'original');
    return {
      mode,
      badge:`AUTO → ${shortName(mode)}`,
      detail:`ANALYSIS CHAMPION • ${round1(d.championRate).toFixed(1)}% • ${Number(d.championHit||0)}/${Number(d.championTotal||0)} • LOCKED`,
      button:`AUTO • ${shortName(mode)}`
    };
  }

  global.LuckyAutoRouteV2=Object.freeze({
    ENGINE_VERSION,LOCK_KEY,decide,formatUi,
    _test:{readAnalysisChampionAuthority,readLock,writeLock,toMode}
  });
})(globalThis);
