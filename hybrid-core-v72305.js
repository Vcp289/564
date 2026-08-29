// V7.23.05 Hybrid Pro: instant durable Actual save + reliable old-style engine completion in serialized background.
(()=>{
  const Q=new Map(), BOOT='luckyNumber_hybrid_bootstrap_v72302';
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const P19STATE_PREFIX='luckyNumber_hybrid_p19_state_v72302_';
  const p19StateKey=id=>`${P19STATE_PREFIX}${Number(id)}`;
  function saveSelectorState(id,st){ try{ localStorage.setItem(p19StateKey(id),JSON.stringify({expertHist:[...(st?.expertHist||[])].slice(-60),v18Hist:[...(st?.v18Hist||[])].slice(-60),lastDate:String(st?.lastDate||''),drawCount:Number(st?.drawCount||0),updatedAt:Date.now()})); return true; }catch(_){return false;} }
  function loadSelectorState(id){ try{ const x=JSON.parse(localStorage.getItem(p19StateKey(id))||'null'); return x&&Array.isArray(x.expertHist)&&Array.isArray(x.v18Hist)?x:null; }catch(_){return null;} }
  function matchItems(items,actual){ const canon=canonical3(actual); return {exact:(items||[]).some(x=>String(x?.number??'')===actual),any:(items||[]).some(x=>canonical3(String(x?.number??''))===canon)}; }
  function computeIncrementalP19X3(draw,id){
    const st=loadSelectorState(id); if(!st) return null;
    const actual=String(draw?.number||''); if(!/^\d{3}$/.test(actual)) return null;
    const table=getPredictionTable(id,draw.date,draw), inputs=table?.inputDigits;
    if(!Array.isArray(inputs)||inputs.length!==5||inputs.some(v=>!/^\d$/.test(String(v)))) return null;
    const grid=formulaGrid(inputs.map(String),getOriginalFormula()); if(!grid) return null;
    const targetDate=String(draw.date||''), pack=patternV19ExpertSet(grid,id,targetDate), v18=pack.v18;
    const sel=patternV19SelectorProbability(pack,[...st.expertHist],[...st.v18Hist],id,targetDate);
    const useExpert=pack.ev.priorCount>=PATTERN_V19_MIN_PRIOR&&sel.probability>=PATTERN_V19_MODEL_THRESHOLD;
    const p19Items=useExpert?pack.items:(v18.items||[]);
    const p19Like={...v18,version:19,shadow:PATTERN_V19_SHADOW,items:p19Items.map(x=>({...x})),selectorStatus:useExpert?'P19-HYBRID-EXPERT':'P19-P18-GUARD',reason:'v19-hybrid-logistic-strict-prior-only',replacements:sel.added.length,priorCount:pack.ev.priorCount,selectorProbability:sel.probability,added:sel.added,removed:sel.dropped};
    const x3=buildX3FromP19Pack(p19Like,pack,{profileId:id,targetDate,inputDigits:inputs,historical:true});
    const em=matchItems(pack.items,actual), am=matchItems(v18.items,actual), pm=matchItems(p19Items,actual), xm=matchItems(x3.items,actual);
    const status=m=>m.exact?'exact':(m.any?'reversed':'notfound');
    const expertHist=[...st.expertHist,em.any?1:0].slice(-60), v18Hist=[...st.v18Hist,am.any?1:0].slice(-60);
    saveSelectorState(id,{expertHist,v18Hist,lastDate:targetDate,drawCount:Number(st.drawCount||0)+1});
    return {p19:status(pm),x3:status(xm)};
  }
  function draws(id){return (state.actualDraws||[]).filter(d=>Number(d?.profileId??0)===Number(id)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.createdAt||0)-Number(b.createdAt||0));}
  async function reliableSync(id,{affectedStartDate='',bootstrap=false}={}){
    id=Number(id); const list=draws(id); if(!list.length) return {ok:true,empty:true};

    // V7.23.05 ROW-FIRST / PERCENT-LATER: a normal newest-day save is strictly incremental.
    // Stage A publishes the visible row only. Aggregate percentages/ranking are deliberately
    // deferred so a 1-day save never waits for a multi-row summary or profile-wide ranking.
    if(!bootstrap){
      const d=list[list.length-1];
      try{ if(!getDailyTable(id,d.date)) upsertDailyTableFromActual(d); }catch(_){}

      // Stage A0 — publish anything already resolvable from immutable pre-result evidence.
      // This is one row only; no snapshot(), ensureRows(12), History summary or Ranking call.
      try{
        const base=getHistoryDisplayComparisonStatuses(d,id)||{};
        const early={classic:base.classic||'pending',aiL:base.aiL||'pending',gl:base.gl||'pending',p18:'pending',p19:'pending',x3:'pending'};
        window.LNCanonicalHistory.commitRow(id,d,early,'row-first-early');
        try{ patchHistoryRowStatusesInstant(id,String(d.id||'')); }catch(_){}
      }catch(e){ console.warn('[Hybrid] row-first early publish deferred',e); }
      await sleep(0);

      // Stage A1 — advance WF by at most ONE row. Existing prefix is reused.
      try{
        if(!walkForwardBucketCoversCurrentHistory(id)){
          const start=nextWalkForwardRepairStartDate(id) || String(d.date||'');
          await rebuildWalkForwardBacktest(id,null,{startDate:start,fastEvolution:true,yieldEvery:1,progressEvery:1,maxRows:1,mutationScope:true});
        }
      }catch(e){ console.warn('[Hybrid] latest WF row deferred',e); }

      // Stage A2 — score this row and patch its six cells immediately.
      // P19/X3 use the persisted incremental selector state when available.
      try{
        const base=getHistoryComparisonStatuses(d,id)||{};
        const inc=computeIncrementalP19X3(d,id);
        const statuses={
          classic:base.classic||'pending', aiL:base.aiL||'pending', gl:base.gl||'pending',
          p18:patternV18HistoryStatus(d,id)||'pending', p19:inc?.p19||patternV19HistoryStatus(d,id)||'pending', x3:inc?.x3||x3HistoryStatus(d,id)||'pending'
        };
        window.LNCanonicalHistory.commitRow(id,d,statuses,'row-first-final');
        try{ patchHistoryRowStatusesInstant(id,String(d.id||'')); }catch(_){}
        try{ window.dispatchEvent(new CustomEvent('ln-canonical-history-update',{detail:{profileId:id,rowFirst:true}})); }catch(_){}
      }catch(e){ console.warn('[Hybrid] latest-row row-first publish',e); }

      // Stage B — percentages and ranking are intentionally later. Keep the current screen
      // usable, yield to Safari, and update aggregates only after the result cells are visible.
      setTimeout(async()=>{
        try{
          if(document.visibilityState==='hidden') return;
          await sleep(0);
          // One-row canonical bridge only. No full profile hydration.
          try{ window.LNCanonicalHistory.ensureRows(id,[d],{limit:1,newest:true,source:'percent-later-one-row'}); }catch(_){}
          try{ publishInstantProfileRankingAfterSave(id,String(d.date||'')); }catch(_){}
          try{ scheduleHistoryFullStateCommit(1600); }catch(_){}
          if((state.currentView==='history'||state.currentView==='analysis') && Number(state.activeProfile)===id){
            try{ requestAnimationFrame(()=>refreshCurrentView()); }catch(_){}
          }
        }catch(e){ console.warn('[Hybrid] percent-later aggregate refresh deferred',e); }
      },900);

      return {ok:true,complete:walkForwardBucketCoversCurrentHistory(id),incremental:true,rowsProcessed:1,rowFirst:true,percentLater:true};
    }

    // Historical add/edit/delete may legitimately affect a suffix. Keep it serialized,
    // bounded and off the tap path, but do not run automatically on launch.
    for(const d of list){ try{ if(!getDailyTable(id,d.date)) upsertDailyTableFromActual(d); }catch(_){} }
    let guard=0;
    while(!walkForwardBucketCoversCurrentHistory(id) && guard++<64){
      const start=nextWalkForwardRepairStartDate(id) || String(list[0].date||'');
      await rebuildWalkForwardBacktest(id,null,{startDate:start,fastEvolution:true,yieldEvery:8,progressEvery:8,maxRows:16,mutationScope:true});
      await sleep(16);
    }
    if(!walkForwardBucketCoversCurrentHistory(id)) return {ok:false,reason:'wf-incomplete'};
    try{ await warmUnifiedP18ProfileCache(id); }catch(e){console.warn('[Hybrid] P18 suffix repair',e);}
    try{
      const b=await computeP19X3HistoryBundlesAsync(list,id,{fast:true});
      publishUnifiedAIBundles(id,b||{});
      if(b?.p19Bundle) PERF_CACHE.patternV19Bundle.set(p19BundleCacheKey(id),b.p19Bundle);
      if(b?.x3Bundle) PERF_CACHE.x3Bundle.set(x3BundleCacheKey(id),b.x3Bundle);
      if(b?.p19Bundle?.selectorState) saveSelectorState(id,b.p19Bundle.selectorState);
    }catch(e){console.warn('[Hybrid] P19/X3 suffix repair',e);}
    let snap=null;
    try{ snap=await window.LNCanonicalHistory.hydrateProfile(id,{full:false}); }catch(e){console.warn('[Hybrid] canonical suffix publish',e);}
    try{ publishInstantProfileRankingAfterSave(id,String(list[list.length-1]?.date||'')); }catch(_){}
    try{ scheduleHistoryFullStateCommit(1200); }catch(_){}
    return {ok:!snap?.needsRepair,complete:!!snap?.complete,snap,incremental:false};
  }
  function enqueue(id,opts={}){ id=Number(id); const prev=Q.get(id)||Promise.resolve(); const job=prev.catch(()=>{}).then(()=>sleep(80)).then(()=>reliableSync(id,opts)); Q.set(id,job.finally(()=>{if(Q.get(id)===job)Q.delete(id)})); return job; }
  // Mutation hook: keep original instant UI/source commit, replace detached enrichment with one serialized reliable job.
  window.scheduleActualDrawPostCommitEnrichment=function({profileId,wfIncrementalStart,autoTable,actualDrawId,isNewLatestDraw=false,preSaveProfileDraws=null,preSaveCommittedSnapshot=null}){
    const id=Number(profileId); setTimeout(()=>enqueue(id,{affectedStartDate:String(wfIncrementalStart||''),bootstrap:!isNewLatestDraw}),24); return true;
  };
  // Navigation never computes. Startup migration runs once, serialized profile-by-profile.
  window.scheduleHistoryDerivedSelfHeal=function(){return true;};
  async function bootstrapOnce(){
    try{ if(localStorage.getItem(BOOT)==='done') return; const ids=[...new Set((state.actualDraws||[]).map(d=>Number(d.profileId??0)))].filter(Number.isFinite); for(const id of ids){ if(document.visibilityState==='hidden') break; const s=window.LNCanonicalHistory.snapshot(id); if(s.needsRepair) await enqueue(id,{bootstrap:true}); await sleep(30); } localStorage.setItem(BOOT,'done'); }catch(e){console.warn('[Hybrid] bootstrap deferred',e);}
  }
  // V7.23.05: no automatic all-profile bootstrap on launch/import. Direct-source rendering is sufficient;
  // explicit historical mutations invoke serialized suffix repair when needed.
  // setTimeout(bootstrapOnce,1800); // intentionally disabled
  window.LNHybridPro={enqueue,reliableSync,bootstrapOnce};
})();
