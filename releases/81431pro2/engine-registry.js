/* LuckyNumber Engine Registry — one lifecycle contract for active engines.
 * Algorithms remain untouched.  This adapter layer standardizes readiness,
 * prediction-status, history-status and AUTO naming so consumers no longer need
 * engine-specific if/else chains.  X3 and P19 are first-class active adapters.
 */
(function(global){
  'use strict';
  const VERSION='ENGINE_REGISTRY_V1';
  const READY=new Set(['exact','reversed','swap','miss']);
  const normalize=value=>{
    const s=String(value||'pending').toLowerCase();
    if(s==='hit') return 'exact';
    if(s==='reverse'||s==='rev') return 'reversed';
    if(s==='notfound'||s==='not_found'||s==='nohit'||s==='no-hit') return 'miss';
    return READY.has(s)?s:'pending';
  };
  const safely=(fn,fallback='pending')=>{try{return fn();}catch(_){return fallback;}};
  const active=Object.freeze(['classic','aiL','gl','p18','p19','x3']);
  const autoNames=Object.freeze({classic:'original',aiL:'ai',gl:'gl',p18:'pattern',p19:'p19',x3:'x3'});
  const labels=Object.freeze({classic:'Classic L',aiL:'AI L',gl:'AI GL',p18:'P18',p19:'P19',x3:'X3'});

  function comparison(draw,profileId){
    return safely(()=>global.getHistoryDisplayComparisonStatuses(draw,profileId)||{},{});
  }
  function engineStatus(id,draw,profileId){
    const base=comparison(draw,profileId);
    if(id==='classic') return normalize(base.classic);
    if(id==='aiL') return normalize(base.aiL);
    if(id==='gl') return normalize(base.gl);
    if(id==='p18') return normalize(safely(()=>global.patternV18HistoryStatus(draw,profileId)));
    if(id==='p19') return normalize(safely(()=>global.patternV19HistoryStatus(draw,profileId)));
    if(id==='x3') return normalize(safely(()=>global.x3HistoryStatus(draw,profileId)));
    return 'pending';
  }
  function statuses(draw,profileId){
    return Object.fromEntries(active.map(id=>[id,engineStatus(id,draw,profileId)]));
  }
  function statusesForAuto(draw,profileId){
    const canonical=statuses(draw,profileId);
    return Object.fromEntries(active.map(id=>[autoNames[id],canonical[id]]));
  }
  function readiness(id,profileId){
    const state=global.state||{};
    if(id==='classic') return {ready:true,reason:'built-in'};
    if(id==='aiL') return {ready:Boolean(state.aiFormulaLab?.[profileId]?.formula),reason:'formula'};
    if(id==='gl') return {ready:Boolean(state.aiGLFormulaLab?.[profileId]?.formula),reason:'formula'};
    if(id==='p18') return {ready:typeof global.buildPatternV18Candidates==='function',reason:'runtime'};
    if(id==='p19') return {ready:typeof global.buildPatternV19Candidates==='function',reason:'runtime'};
    if(id==='x3') return {ready:typeof global.buildX3Candidates==='function',reason:'runtime'};
    return {ready:false,reason:'unknown'};
  }
  const get=id=>active.includes(id)?Object.freeze({id,label:labels[id],autoName:autoNames[id],status:(draw,profileId)=>engineStatus(id,draw,profileId),ready:profileId=>readiness(id,profileId)}):null;
  function selfTest(){
    const names=active.map(id=>autoNames[id]);
    const unique=new Set(names).size===active.length;
    return Object.freeze({ok:unique&&active.length===6&&normalize('notfound')==='miss',version:VERSION,engines:active.slice()});
  }
  global.LuckyEngineRegistry=Object.freeze({VERSION,ids:()=>active.slice(),canonicalIds:()=>active.slice(),get,labels,autoNames,normalize,statuses,statusesForAuto,readiness,selfTest});
})(globalThis);
