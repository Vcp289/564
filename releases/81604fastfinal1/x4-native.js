/* LuckyNumber V8.16 — Native X4 Coverage engine.
 * Coverage union: Classic L + X3 + strict-prior Global Hamming KNN (K80/W600/Top21).
 * X4 is independent from X3: it consumes X3 output but never mutates or replaces it.
 */
(function(global){
  'use strict';
  const VERSION='X4-COVERAGE-577-R1';
  const K=80, WINDOW=600, TOP=21;
  const resultCache=new Map(), historyCache=new Map();
  // Rebuild's deterministic seven-pass ranking audit must reuse the exact X4
  // candidates produced in its first pass.  Keeping only 160 rows made a 2,000+
  // row restore evict and rebuild nearly everything on every audit pass.
  function resultCacheLimit(){
    const job=typeof state!=="undefined" ? state?.walkForwardRebuildJob : null;
    return job?.status==='running' && job?.fastRebuild ? 4096 : 160;
  }
  let rowsCache={signature:'',rows:[]};
  const digits=v=>String(v??'').replace(/\D/g,'');
  const canon=v=>{const s=digits(v).padStart(3,'0').slice(-3);return s.split('').sort().join('');};
  const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||'').slice(0,10));
  const datasetSignature=()=>`${Number(state?._profileRevision||0)}|${Number(state?._persistenceUpdatedAt||0)}|${(state?.actualDraws||[]).length}`;

  function trainingRows(){
    const signature=datasetSignature();
    if(rowsCache.signature===signature) return rowsCache.rows;
    const source=[...(state?.actualDraws||[])].filter(r=>validDate(r?.date)&&/^\d{3}$/.test(digits(r?.number))).sort((a,b)=>
      String(a.date).localeCompare(String(b.date))||Number(a.profileId??0)-Number(b.profileId??0)||Number(a.createdAt||0)-Number(b.createdAt||0));
    const previous=new Map(), rows=[];
    for(const draw of source){
      const pid=Number(draw.profileId??0), prev=previous.get(pid);
      if(prev){
        const input=`${digits(prev.number).padStart(3,'0').slice(-3)}${digits(prev.twoDigit).padStart(2,'0').slice(-2)}`;
        if(/^\d{5}$/.test(input)) rows.push({date:String(draw.date).slice(0,10),profileId:pid,input,actual:canon(draw.number)});
      }
      previous.set(pid,draw);
    }
    rowsCache={signature,rows};
    resultCache.clear(); historyCache.clear();
    return rows;
  }
  function hamming(a,b){let d=0;for(let i=0;i<5;i++)if(a[i]!==b[i])d++;return d;}
  function knn(input,targetDate,profileId){
    // V8.16.5 fix: this used to search trainingRows() across every profile (Taiwan, Korea,
    // Hanoi, India, ...) with no profileId filter at all, so a profile's KNN neighbours could
    // be drawn from a completely different lottery market. Every sibling engine (X3/P18/P19)
    // is strictly scoped to the active profile; X4 must be too.
    const pid=Number(profileId)||0;
    if(!/^\d{5}$/.test(input)||!validDate(targetDate)) return [];
    const prior=trainingRows().filter(r=>r.profileId===pid&&r.date<targetDate).slice(-WINDOW).map(r=>({...r,d:hamming(input,r.input)})).sort((a,b)=>a.d-b.d||b.date.localeCompare(a.date)).slice(0,K);
    const votes=new Map();
    prior.forEach((r,i)=>{const w=1/(1+r.d)+((K-i)/K)*0.001;votes.set(r.actual,(votes.get(r.actual)||0)+w);});
    return [...votes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,TOP).map(([number,score],i)=>({number,score,aiRank:i+1,source:'KNN'}));
  }
  function add(map,item,source,rank){
    const number=canon(item?.number??item); if(!/^\d{3}$/.test(number)) return;
    const prev=map.get(number)||{number,score:0,sources:[],aiRank:999};
    if(!prev.sources.includes(source)) prev.sources.push(source);
    prev.score+=source==='X3'?300-rank:source==='Classic'?200-rank:100-rank;
    prev.aiRank=Math.min(prev.aiRank,rank); map.set(number,prev);
  }
  function buildX4Candidates(grid,profileId,targetDate,inputDigits,historical=false){
    const input=(Array.isArray(inputDigits)?inputDigits:[]).map(String).join('');
    const date=String(targetDate||'').slice(0,10), pid=Number(profileId)||0;
    const key=`${datasetSignature()}|${pid}|${date}|${input}|${historical?'H':'L'}|${JSON.stringify(grid||[])}`;
    if(resultCache.has(key)) return resultCache.get(key);
    const classic=typeof findLResults==='function'?findLResults(grid||[]):[];
    let x3=[]; try{x3=buildX3Candidates(grid||[],pid,date,Array.isArray(inputDigits)?inputDigits:[],historical)?.items||[];}catch(_){}
    const nearest=knn(input,date,pid), map=new Map();
    classic.forEach((x,i)=>add(map,x,'Classic',i+1));
    x3.forEach((x,i)=>add(map,x,'X3',i+1));
    nearest.forEach((x,i)=>add(map,x,'KNN',i+1));
    const items=[...map.values()].sort((a,b)=>b.sources.length-a.sources.length||b.score-a.score||a.number.localeCompare(b.number)).map((x,i)=>({...x,aiRank:i+1,coverageRank:i+1}));
    const out={items,ready:items.length>0,version:VERSION,selectorStatus:`STRICT PRIOR • K${K} / W${WINDOW} / TOP${TOP}`,tableKind:'coverage',classicCount:classic.length,x3Count:x3.length,knnCount:nearest.length,historical:Boolean(historical)};
    resultCache.set(key,out); if(resultCache.size>resultCacheLimit())resultCache.delete(resultCache.keys().next().value);
    return out;
  }
  function historyStatus(draw,profileId){
    const pid=Number(profileId??draw?.profileId??0), actual=digits(draw?.number).padStart(3,'0').slice(-3);
    if(!/^\d{3}$/.test(actual)||!validDate(draw?.date)) return 'pending';
    const key=`${datasetSignature()}|${pid}|${draw.id||draw.date}|${actual}`; if(historyCache.has(key))return historyCache.get(key);
    let status='pending';
    try{
      const table=getPredictionTable(pid,String(draw.date).slice(0,10),draw);
      const input=Array.isArray(table?.inputDigits)?table.inputDigits.map(String):[];
      const grid=input.length===5?formulaGrid(input,getOriginalFormula()):null;
      if(grid){const items=buildX4Candidates(grid,pid,String(draw.date).slice(0,10),input,true).items;status=items.some(x=>String(x.number)===actual)?'exact':items.some(x=>canon(x.number)===canon(actual))?'reversed':'notfound';}
    }catch(_){}
    historyCache.set(key,status); if(historyCache.size>4096)historyCache.delete(historyCache.keys().next().value); return status;
  }
  function clearCache(){resultCache.clear();historyCache.clear();rowsCache={signature:'',rows:[]};}
  global.buildX4Candidates=buildX4Candidates;
  global.x4HistoryStatus=historyStatus;
  global.X4Coverage577=Object.freeze({VERSION,K,WINDOW,TOP,build:buildX4Candidates,historyStatus,clearCache});
  global.addEventListener?.('x3-pro-ready',clearCache,{passive:true});
})(globalThis);
