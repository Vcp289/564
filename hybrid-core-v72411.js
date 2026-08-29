// V7.24.11 Hybrid Pro: instant durable Actual save + reliable old-style engine completion in serialized background.
(()=>{
  const Q=new Map(), SUFFIX_TIMERS=new Map(), SUFFIX_EARLIEST=new Map(), BOOT='luckyNumber_hybrid_bootstrap_v72302';
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
  async function reliableSync(id,{affectedStartDate='',bootstrap=false,targetDrawId='',targetDate=''}={}){
    id=Number(id); const list=draws(id); if(!list.length) return {ok:true,empty:true};

    // V7.24.11 ROW-FIRST / PERCENT-LATER: a normal newest-day save is strictly incremental.
    // Stage A publishes the visible row only. Aggregate percentages/ranking are deliberately
    // deferred so a 1-day save never waits for a multi-row summary or profile-wide ranking.
    if(!bootstrap){
      // V7.24.11 CONTINUOUS SAVE FIX: each queued save owns its exact row.
      // Never re-resolve to list[list.length-1] at execution time, because several saves
      // can be queued before the worker runs; doing so caused all jobs to score only the
      // newest row and left intermediate days as pending/—.
      const d=(targetDrawId?list.find(x=>String(x?.id||'')===String(targetDrawId)):null)
        || (targetDate?list.find(x=>String(x?.date||'')===String(targetDate)):null)
        || list[list.length-1];
      try{ if(!getDailyTable(id,d.date)) upsertDailyTableFromActual(d); }catch(_){}

      // V7.24.11 ATOMIC ROW COMMIT PRO
      // Never paint a half-finished row. The six visible engines are resolved in memory
      // first, then committed + painted exactly once. This removes the X3/P19-first
      // flicker seen during rapid backdate entry and also reduces repeated DOM renders.
      const readyStatus=v=>['exact','reversed','swap','notfound','miss'].includes(String(v||'').toLowerCase());
      const allSixReady=statuses=>['classic','aiL','gl','p18','p19','x3'].every(k=>readyStatus(statuses?.[k]));
      let statuses=null, atomicPublished=false;

      // Stage A1 — reconstruct THIS target row only when its trusted WF record is absent.
      // Do not advance the globally-earliest missing row here: on rapid historical entry
      // that used to spend the one-row budget on an older date and leave the tapped date
      // partially ready. startDate=d.date makes the foreground budget deterministic.
      try{
        let base=getHistoryComparisonStatuses(d,id)||{};
        if(!base.trusted){
          await rebuildWalkForwardBacktest(id,null,{startDate:String(d.date||''),fastEvolution:true,yieldEvery:1,progressEvery:1,maxRows:1,mutationScope:true});
          base=getHistoryComparisonStatuses(d,id)||{};
        }

        // Stage A2 — resolve all six from the same trusted generation. P19/X3 deliberately
        // use the normal strict-prior-only row resolvers here; the old incremental selector
        // could finish before WF and was the source of partial two-cell publication.
        statuses={
          classic:base.classic||'pending', aiL:base.aiL||'pending', gl:base.gl||'pending',
          p18:patternV18HistoryStatus(d,id)||'pending',
          p19:patternV19HistoryStatus(d,id)||'pending',
          x3:x3HistoryStatus(d,id)||'pending'
        };

        if(allSixReady(statuses)){
          window.LNCanonicalHistory.commitRow(id,d,statuses,'atomic-row-final');
          try{ patchHistoryRowStatusesInstant(id,String(d.id||'')); }catch(_){}
          try{ window.dispatchEvent(new CustomEvent('ln-canonical-history-update',{detail:{profileId:id,rowFirst:true,atomicRow:true}})); }catch(_){}
          atomicPublished=true;
        }
      }catch(e){ console.warn('[Hybrid] atomic row publish deferred',e); }

      // If one engine still has no strict-prior evidence, keep the ENTIRE visible row at
      // its prior state (normally six dashes) instead of leaking a partial generation.
      // The coalesced suffix repair can complete it later and History will then paint the
      // complete generation. No spinner, no page lock, no repeated six-cell patching.
      if(!atomicPublished){
        try{ scheduleCoalescedSuffixRepair(id,String(d.date||'')); }catch(_){}
      }

      // Stage B — percentages and ranking only after the atomic row is visible.
      // If the row is not ready yet, suffix repair owns the later aggregate refresh.
      if(atomicPublished) setTimeout(async()=>{
        try{
          if(document.visibilityState==='hidden') return;
          await sleep(0);
          try{ window.LNCanonicalHistory.ensureRows(id,[d],{limit:1,newest:true,source:'percent-later-atomic-row'}); }catch(_){}
          try{ publishInstantProfileRankingAfterSave(id,String(d.date||'')); }catch(_){}
          try{ scheduleHistoryFullStateCommit(1600); }catch(_){}
          if((state.currentView==='history'||state.currentView==='analysis') && Number(state.activeProfile)===id){
            try{ requestAnimationFrame(()=>refreshCurrentView()); }catch(_){}
          }
        }catch(e){ console.warn('[Hybrid] percent-later aggregate refresh deferred',e); }
      },900);

      return {ok:true,complete:walkForwardBucketCoversCurrentHistory(id),incremental:true,rowsProcessed:1,rowFirst:true,atomicRow:true,atomicPublished,percentLater:true};
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
  function enqueue(id,opts={}){ id=Number(id); const prev=Q.get(id)||Promise.resolve(); const job=prev.catch(()=>{}).then(()=>sleep(40)).then(()=>reliableSync(id,opts)); Q.set(id,job.finally(()=>{if(Q.get(id)===job)Q.delete(id)})); return job; }
  function scheduleCoalescedSuffixRepair(id,startDate){
    id=Number(id); const d=String(startDate||'');
    const prev=String(SUFFIX_EARLIEST.get(id)||'');
    if(d && (!prev || d<prev)) SUFFIX_EARLIEST.set(id,d);
    const old=SUFFIX_TIMERS.get(id); if(old) clearTimeout(old);
    const t=setTimeout(()=>{
      SUFFIX_TIMERS.delete(id);
      const earliest=String(SUFFIX_EARLIEST.get(id)||''); SUFFIX_EARLIEST.delete(id);
      // Correctness repair for rows after a historical insertion is intentionally idle/coalesced.
      // Multiple rapid saves produce ONE suffix repair, never one heavy repair per tap.
      enqueue(id,{affectedStartDate:earliest,bootstrap:true}).catch(()=>{});
    },2600);
    SUFFIX_TIMERS.set(id,t);
  }
  // Mutation hook: EVERY added/edited row gets row-first scoring immediately, even when backdated.
  // Historical suffix correctness is repaired later, once, after the user stops saving.
  window.scheduleActualDrawPostCommitEnrichment=function({profileId,wfIncrementalStart,autoTable,actualDrawId,isNewLatestDraw=false,preSaveProfileDraws=null,preSaveCommittedSnapshot=null}){
    const id=Number(profileId);
    const row=(state.actualDraws||[]).find(x=>String(x?.id||'')===String(actualDrawId||''));
    const targetDrawId=String(actualDrawId||''), targetDate=String(row?.date||'');
    setTimeout(()=>enqueue(id,{affectedStartDate:String(wfIncrementalStart||''),bootstrap:false,targetDrawId,targetDate}),16);
    if(!isNewLatestDraw) scheduleCoalescedSuffixRepair(id,String(wfIncrementalStart||targetDate||''));
    return true;
  };
  // Navigation never computes. Startup migration runs once, serialized profile-by-profile.
  window.scheduleHistoryDerivedSelfHeal=function(){return true;};
  async function bootstrapOnce(){
    try{ if(localStorage.getItem(BOOT)==='done') return; const ids=[...new Set((state.actualDraws||[]).map(d=>Number(d.profileId??0)))].filter(Number.isFinite); for(const id of ids){ if(document.visibilityState==='hidden') break; const s=window.LNCanonicalHistory.snapshot(id); if(s.needsRepair) await enqueue(id,{bootstrap:true}); await sleep(30); } localStorage.setItem(BOOT,'done'); }catch(e){console.warn('[Hybrid] bootstrap deferred',e);}
  }
  // V7.24.11: no automatic all-profile bootstrap on launch/import. Direct-source rendering is sufficient;
  // explicit historical mutations invoke serialized suffix repair when needed.
  // setTimeout(bootstrapOnce,1800); // intentionally disabled
  window.LNHybridPro={enqueue,reliableSync,bootstrapOnce};
})();
