/* LuckyNumber V8.14 — AUTO Route Ranking Authority PRO
 * NEW ENGINE. The V7.22.06 selector is intentionally retained in app-v72210.js as fallback.
 * Contract: strict prior-only evidence, deterministic scoring, versioned evidence lock,
 * no same-day result leakage, per-engine readiness, X3 never blocks Calculate, immutable Daily Lock.
 */
(function(global){
  'use strict';

  const ENGINE_VERSION='AUTO_ROUTE_V5_EXACT_ANALYSIS_AUTHORITY_NPLUS1';
  const LOCK_KEY='luckyNumber_auto_route_v5_lock_v81431_exact_analysis_authority';
  const MIN_TOTAL=14;
  const LOW_CONFIDENCE_SCORE=20;
  const PRIORITY=Object.freeze({p19:0,x3:1,pattern:2,gl:3,ai:4,original:5});
  const WINDOWS=Object.freeze([
    {name:'14',size:14,weight:0.35},
    {name:'30',size:30,weight:0.30},
    {name:'60',size:60,weight:0.20},
    {name:'all',size:0,weight:0.15}
  ]);

  function round1(n){ return Math.round((Number(n)||0)*10)/10; }
  function clamp(n,a,b){ return Math.max(a,Math.min(b,Number(n)||0)); }
  function fnv1a(text){
    let h=0x811c9dc5;
    const s=String(text||'');
    for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193); }
    return (h>>>0).toString(16).padStart(8,'0');
  }
  function normalizeStatus(status){
    const s=String(status||'pending').toLowerCase();
    if(['exact','hit'].includes(s)) return 'exact';
    if(['reversed','reverse','rev','swap'].includes(s)) return s==='swap'?'swap':'reversed';
    if(['notfound','miss'].includes(s)) return 'miss';
    return 'pending';
  }
  function sourceFingerprint(draws,targetDate,profileId,statusRows=[]){
    // V8.13: Daily Lock validity includes the committed AI evidence generation, not only
    // actual 3D/2D results. A History Refresh that publishes X3/P19/P18/etc statuses
    // must invalidate a stale route exactly once, while unchanged evidence stays deterministic.
    const body=(draws||[]).map((d,i)=>{
      const r=statusRows?.[i]||{};
      const evidence=['original','ai','gl','pattern','p19','x3'].map(k=>normalizeStatus(r?.[k])).join(',');
      return [Number(d?.profileId??0),String(d?.date||''),String(d?.number||''),String(d?.twoDigit||''),evidence].join(':');
    }).join('|');
    return fnv1a(`${ENGINE_VERSION}|${Number(profileId)}|${String(targetDate)}|${body}`);
  }
  function loadBox(){
    try{
      const raw=JSON.parse(localStorage.getItem(LOCK_KEY)||'null');
      return raw&&raw.schema===2&&raw.engineVersion===ENGINE_VERSION?raw:{schema:2,engineVersion:ENGINE_VERSION,dates:{}};
    }catch(_){ return {schema:2,engineVersion:ENGINE_VERSION,dates:{}}; }
  }
  function readLockItem(targetDate,profileId){
    try{
      const box=loadBox();
      const item=box?.dates?.[String(targetDate)]?.[String(Number(profileId))];
      if(!item) return null;
      if(item.engineVersion!==ENGINE_VERSION) return null;
      if(item.targetDate!==String(targetDate)||Number(item.profileId)!==Number(profileId)) return null;
      return item;
    }catch(_){ return null; }
  }
  function readConfirmedLock(targetDate,profileId){
    const item=readLockItem(targetDate,profileId);
    if(!item || item.lockState!=='confirmed') return null;
    return item.decision||null;
  }
  function writeLock(targetDate,profileId,fingerprint,decision,lockState='confirmed'){
    try{
      const box=loadBox(), date=String(targetDate), pid=String(Number(profileId));
      box.dates=box.dates||{}; box.dates[date]=box.dates[date]||{};
      const prev=box.dates[date][pid]||null;
      // N+1 contract: once CONFIRMED, the Profile + targetDate route is immutable.
      if(prev?.lockState==='confirmed' && prev?.engineVersion===ENGINE_VERSION) return prev.decision||decision;
      box.dates[date][pid]={targetDate:date,profileId:Number(profileId),engineVersion:ENGINE_VERSION,fingerprint,lockState,createdAt:prev?.createdAt||Date.now(),updatedAt:Date.now(),decision};
      const dates=Object.keys(box.dates).sort();
      while(dates.length>14) delete box.dates[dates.shift()];
      localStorage.setItem(LOCK_KEY,JSON.stringify(box));
    }catch(_){ /* lock failure must never block Calculate */ }
    return decision;
  }

  // Pro quality policy: a direct match is the primary performance metric.  Reversed
  // and swapped values remain visible diagnostics but must never inflate the score
  // that chooses an AUTO route.
  function isHit(status){ return normalizeStatus(status)==='exact'; }
  function isVariant(status){ const s=normalizeStatus(status); return s==='reversed'||s==='swap'; }
  function buildStatusRows(draws,id){
    const rows=[];
    for(const draw of (draws||[])){
      // V8.13 SYSTEMIC FIX: AUTO consumes the exact same foreground History authority
      // as the six-column History table. Canonical Six / strict Atomic rows win first;
      // Route A may resolve an already-valid prior-only row; model-private runtime timing
      // is no longer allowed to silently downgrade X3/P19/P18 to pending for AUTO.
      let h=null;
      try{ h=getHistoryRouteAStatuses(draw,id,{display:true})||null; }catch(_){}
      if(!h){
        try{ h=getUnifiedAIHistoryStatuses(draw,id,{display:true})||null; }catch(_){}
      }
      if(!h){
        try{ h=getHistoryComparisonStatuses(draw,id)||null; }catch(_){}
      }
      rows.push({
        original:normalizeStatus(h?.classic),
        ai:normalizeStatus(h?.aiL),
        gl:normalizeStatus(h?.gl),
        pattern:normalizeStatus(h?.p18),
        p19:normalizeStatus(h?.p19),
        x3:normalizeStatus(h?.x3)
      });
    }
    return rows;
  }
  function summarizeStatusRows(rows,key){
    let hit=0,variants=0,total=0;
    for(const row of (rows||[])){
      const status=row?.[key]||'pending'; if(status==='pending') continue;
      total++; if(isHit(status)) hit++; else if(isVariant(status)) variants++;
    }
    return {rate:total?Math.round(hit*1000/total)/10:0,total,exact:hit,variants,
      variantRate:total?Math.round(variants*1000/total)/10:0,
      expandedRate:total?Math.round((hit+variants)*1000/total)/10:0};
  }
  function collectWindowsFromRows(rows,key){
    const out={};
    for(const w of WINDOWS){
      const sample=w.size>0?rows.slice(-w.size):rows;
      out[w.name]=summarizeStatusRows(sample,key);
    }
    return out;
  }
  function weightedEvidence(windows){
    let numerator=0,weightSum=0;
    const usable=[];
    for(const w of WINDOWS){
      const x=windows[w.name]||{};
      if(Number(x.total||0)<=0) continue;
      // Recent windows with very few trusted rows contribute proportionally less.
      const coverage=w.size>0?clamp(Number(x.total||0)/Math.min(w.size,MIN_TOTAL),0.25,1):1;
      const effective=w.weight*coverage;
      numerator+=Number(x.rate||0)*effective; weightSum+=effective;
      usable.push(Number(x.rate||0));
    }
    const weighted=weightSum?numerator/weightSum:0;
    const mean=usable.length?usable.reduce((a,b)=>a+b,0)/usable.length:0;
    const variance=usable.length?usable.reduce((a,b)=>a+Math.pow(b-mean,2),0)/usable.length:0;
    const volatility=Math.sqrt(variance);
    const total=Number(windows.all?.total||0);
    const sampleConfidence=clamp(Math.sqrt(Math.min(total,60)/60),0,1);
    // Stability is a penalty, never a hidden bonus. Sample confidence only trims weak evidence.
    const score=weighted*(0.82+0.18*sampleConfidence)-Math.min(4,volatility*0.22);
    return {weightedRate:round1(weighted),volatility:round1(volatility),sampleConfidence:round1(sampleConfidence*100),proScore:round1(score)};
  }
  function localDateFromTimestamp(ts){
    const n=Number(ts||0); if(!n) return '';
    try{ const d=new Date(n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }catch(_){ return ''; }
  }
  function engineName(key){ return key==='x3'?'X3':key==='p19'?'P19':key==='pattern'?'P18':key==='gl'?'AI GL':key==='ai'?'AI L':'Classic L'; }
  function shortName(key){ return key==='pattern'?'P18':key==='gl'?'GL':key==='ai'?'AIL':key==='original'?'CLS':String(key||'').toUpperCase(); }
  function rankCandidates(candidates){
    // V8.14 RANKING AUTHORITY: AUTO must select the same champion visible in History.
    // History orders engines by committed strict-prior ALL accuracy first, then coverage,
    // then the deterministic safety priority. Recent 14/30/60 and Pro Score remain
    // diagnostics/confidence signals only; they can no longer override the History leader.
    return [...candidates].sort((a,b)=>
      Number(b.allRate||0)-Number(a.allRate||0) ||
      Number(b.total||0)-Number(a.total||0) ||
      Number(b.proScore||0)-Number(a.proScore||0) ||
      Number(PRIORITY[a.key]??99)-Number(PRIORITY[b.key]??99)
    );
  }

  function decide(profileId){
    const id=Number(profileId), targetDate=autoRouteTargetDate();
    // V8.08 IMMEDIATE AUTO: hydration is no longer a UI gate.  We can score the
    // already-loaded strict-prior History immediately, while the heavier mirrors/X3
    // runtime continue restoring in the background.  A provisional decision is never
    // persisted until the normal evidence-ready authority is confirmed.
    const evidenceAuthorityReady=Boolean(autoRouteEvidenceReady(id));

    // V8.14.30 AUTHORITY + N+1: only a CONFIRMED Daily Lock is authoritative on reopen.
    // PROVISIONAL/EARLY locks are intentionally allowed one re-evaluation after the
    // History/Ranking authority becomes ready; after confirmation the day is immutable.
    const confirmedLock=readConfirmedLock(targetDate,id);
    if(confirmedLock) return {...confirmedLock,locked:true,provisional:false,lockState:'confirmed',lockReused:true,restoredAfterLaunch:true};
    // V8.14.31: PROVISIONAL is intentionally non-durable. Recompute it from the
    // current Analysis authority so an early P18/P19 can never survive an app kill.

    // THE anti-leak boundary. No function below receives targetDate or future rows.
    const prior=(state.actualDraws||[])
      .filter(d=>Number(d?.profileId??0)===id && String(d?.date||'')<String(targetDate))
      .sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
    // Build one immutable History-authority row set before validating a Daily Lock.
    // This is required because Refresh can change AI evidence without changing 3D/2D results.
    const statusRows=buildStatusRows(prior,id);
    const fingerprint=sourceFingerprint(prior,targetDate,id,statusRows);

    const saved=state.aiFormulaLab?.[id]||null, glSaved=state.aiGLFormulaLab?.[id]||null;
    const aiCreated=localDateFromTimestamp(saved?.createdAt||saved?.autoLearnedAt);
    const glCreated=localDateFromTimestamp(glSaved?.createdAt||glSaved?.autoLearnedAt);
    const aiModelPrior=!aiCreated||aiCreated<targetDate;
    const glModelPrior=!glCreated||glCreated<targetDate;

    const keys=['original','ai','gl','pattern','p19','x3'];
    // One strict-prior History-authority pass only. The same immutable row set validates
    // the lock fingerprint and feeds 14/30/60/All scoring, preventing source mismatch.
    const evidence={};
    for(const key of keys){
      const windows=collectWindowsFromRows(statusRows,key), pro=weightedEvidence(windows);
      evidence[key]={key,name:engineName(key),windows,...pro,total:Number(windows.all?.total||0),allRate:Number(windows.all?.rate||0)};
    }

    // V8.14.30 SINGLE RANKING AUTHORITY:
    // AUTO never ranks from its private statusRows anymore.  It asks the exact same
    // buildHistoryChampionSummary path used by Analysis, but with the strict-prior
    // draw slice so the prediction target can never leak into its own route.
    let authority=null;
    try{
      authority=(typeof getAutoRouteAnalysisAuthority==='function')
        ? getAutoRouteAnalysisAuthority(id,targetDate,prior)
        : historyChampionForPriorDraws(prior,id);
    }catch(_){ authority=null; }
    const authorityItems=(authority?.items||[])
      .map(x=>({
        key:x?.key==='p18'?'pattern':x?.key,
        sourceKey:x?.key,
        name:engineName(x?.key==='p18'?'pattern':x?.key),
        allRate:Number(x?.summary?.rate||0),
        total:Number(x?.summary?.total||0),
        hit:Number(x?.summary?.hit||0),
        championScore:Number(x?.championScore||0)
      }))
      .filter(x=>['original','ai','gl','pattern','p19','x3'].includes(x.key) && x.total>0);
    const authorityByKey=new Map(authorityItems.map(x=>[x.key,x]));
    for(const key of keys){
      const a=authorityByKey.get(key);
      if(a){ evidence[key].allRate=a.allRate; evidence[key].total=a.total; evidence[key].authorityHit=a.hit; evidence[key].championScore=a.championScore; }
    }
    const authorityWinnerRaw=authority?.winner||null;
    const authorityWinnerKey=authorityWinnerRaw?.key==='p18'?'pattern':authorityWinnerRaw?.key;
    const authorityWinner=authorityWinnerKey?authorityByKey.get(authorityWinnerKey)||null:null;

    const aiAllowed=Boolean(saved?.formula&&aiModelPrior&&formulaEligibility(saved).allowed);
    const glComparable=Math.min(Number(evidence.ai.total||0),Number(evidence.gl.total||0));
    const glAllowed=Boolean(glSaved?.formula&&glModelPrior&&glComparable>=8&&Number(evidence.gl.allRate||0)>=Number(evidence.ai.allRate||0));
    // V7.24.14 AUTHORITY PRO:
    // Rank from committed/prior-only History evidence, not from transient live-runtime timing.
    // X3 is therefore allowed into EVIDENCE ranking even while its heavy live runtime is loading.
    // If X3 actually wins, we wait for the live X3 runtime BEFORE creating the immutable Daily Lock.
    // This prevents the old race: first paint excluded X3 -> Classic got locked for the whole day.
    const x3RuntimeReady=Boolean(globalThis.X3NestedPro463);
    const recentCoverage=(key)=>Number(evidence?.[key]?.windows?.['14']?.total||0);
    const expectedRecent=Math.min(MIN_TOTAL,prior.length);
    const coreAuthority={
      original:recentCoverage('original'),
      pattern:recentCoverage('pattern'),
      p19:recentCoverage('p19'),
      x3:recentCoverage('x3')
    };
    // V7.24.14: restoration completion and model coverage are different states.
    // autoRouteEvidenceReady() is the sole hydration authority. Missing/young per-engine
    // evidence must become WARMUP/UNAVAILABLE, never an endless RESTORING gate.
    const coreAuthorityReady=true;

    // Candidate display list follows Analysis authority order. Selection is ALWAYS
    // authority.winner; recent windows / Pro Score are diagnostics only.
    const eligible=authorityItems
      .filter(x=>x.total>=MIN_TOTAL)
      .map(x=>({...evidence[x.key],championScore:x.championScore,authorityHit:x.hit}));

    const common={selectorVersion:ENGINE_VERSION,targetDate,strictPriorOnly:true,evidenceFingerprint:fingerprint,minSamples:MIN_TOTAL,trustedOnly:true,
      authoritySource:String(authority?.authoritySource||'historyChampionForPriorDraws/buildHistoryChampionSummary'),
      authoritySourceVersion:2,
      authorityWinner:authorityWinnerKey||null,
      classicRate:round1(evidence.original.allRate),aiRate:round1(evidence.ai.allRate),glRate:round1(evidence.gl.allRate),
      p18Rate:round1(evidence.pattern.allRate),p19Rate:round1(evidence.p19.allRate),x3Rate:round1(evidence.x3.allRate),
      classicTrustedAll:evidence.original.total,aiTrustedAll:evidence.ai.total,glTrustedAll:evidence.gl.total,
      p18Samples:evidence.pattern.total,p19Samples:evidence.p19.total,x3Samples:evidence.x3.total,
      engineAvailability:{
        original:evidence.original.total>=MIN_TOTAL?'ready':'warmup',
        ai:aiAllowed&&evidence.ai.total>=MIN_TOTAL?'ready':(evidence.ai.total?'warmup':'unavailable'),
        gl:glAllowed&&evidence.gl.total>=MIN_TOTAL?'ready':(evidence.gl.total?'warmup':'unavailable'),
        pattern:evidence.pattern.total>=MIN_TOTAL?'ready':(evidence.pattern.total?'warmup':'unavailable'),
        p19:evidence.p19.total>=MIN_TOTAL?'ready':(evidence.p19.total?'warmup':'unavailable'),
        x3:evidence.x3.total>=MIN_TOTAL?(x3RuntimeReady?'ready':'evidence-ready/runtime-loading'):(evidence.x3.total?'warmup':'unavailable')
      },
      evidenceWindows:Object.fromEntries(keys.map(k=>[k,evidence[k].windows]))};

    // Before 14 trusted samples, use Analysis' current winner only as PROVISIONAL.
    // Once the same authority has >=14 rows and restoration is ready, N+1 may CONFIRM it.
    if(!authorityWinner || Number(authorityWinner.total||0)<MIN_TOTAL){
      const bestKey=authorityWinnerKey||'original';
      const best=evidence[bestKey]||evidence.original;
      const bestObserved=Number(authorityWinner?.total||Math.max(0,...authorityItems.map(x=>x.total)));
      const provisionalDecision={...common,mode:bestKey,ready:true,hydrating:false,locked:false,provisional:true,lockState:'provisional',lowConfidence:true,confidenceLabel:'EARLY',proScore:round1(best?.proScore||0),
        recent14Rate:round1(best?.windows?.['14']?.rate||0),recent30Rate:round1(best?.windows?.['30']?.rate||0),weightedRate:round1(best?.weightedRate||0),stability:round1(best?.volatility||0),
        candidatePool:authorityItems.map(x=>x.key),coreAuthority,warmupCount:bestObserved,reason:`AUTO ใช้ Analysis Authority → ${engineName(bestKey)} ชั่วคราว • EARLY ${bestObserved}/${MIN_TOTAL} • รอ N+1 Confirmed`};
      return provisionalDecision;
    }

    const top={...evidence[authorityWinnerKey],championScore:Number(authorityWinner.championScore||0)};
    const secondAuthority=authorityItems.find(x=>x.key!==authorityWinnerKey && x.total>=MIN_TOTAL)||null;
    const second=secondAuthority?{...evidence[secondAuthority.key],championScore:Number(secondAuthority.championScore||0)}:null;
    const ranked=authorityItems.filter(x=>x.total>=MIN_TOTAL).map(x=>({...evidence[x.key],championScore:x.championScore}));


    // X3 may be the evidence winner before its deferred live runtime arrives. In that case,
    // correctness wins over a fast-but-wrong Classic lock: keep the decision provisional and
    // let the existing x3-pro-ready event rerender/lock the exact same winner moments later.
    if(top?.key==='x3' && !x3RuntimeReady){
      const provisionalDecision={...common,mode:'x3',ready:true,hydrating:false,locked:false,provisional:true,lockState:'provisional',lowConfidence:false,confidenceLabel:'SELECTED',
        proScore:round1(top.proScore),recent14Rate:round1(top.windows['14'].rate),recent30Rate:round1(top.windows['30'].rate),
        weightedRate:round1(top.weightedRate),stability:round1(top.volatility),candidatePool:ranked.map(x=>x.key),coreAuthority,
        reason:`AUTO เลือก X3 จาก Prior-only Ranking • รอ X3 runtime เพื่อยืนยัน N+1 Daily Lock`};
      return provisionalDecision;
    }
    const scoreGap=second?round1(top.proScore-second.proScore):99;
    const low=Number(top.proScore||0)<LOW_CONFIDENCE_SCORE || Number(top.total||0)<20;
    const confidence=low?'LOW':(scoreGap>=3&&top.sampleConfidence>=70?'HIGH':'MEDIUM');

    // V8.14.30: no AUTO COMBO override here. Analysis Authority has exactly one
    // deterministic winner (including tie-breaks), so AUTO must route to that same winner.

    const decision={...common,mode:top.key,ready:true,locked:true,provisional:false,lockState:'confirmed',lowConfidence:low,confidenceLabel:confidence,
      proScore:round1(top.proScore),recent14Rate:round1(top.windows['14'].rate),recent30Rate:round1(top.windows['30'].rate),recent60Rate:round1(top.windows['60'].rate),
      weightedRate:round1(top.weightedRate),stability:round1(top.volatility),sampleConfidence:round1(top.sampleConfidence),scoreGap,
      candidatePool:ranked.map(x=>x.key),
      reason:`AUTO Authority • Analysis champion ${top.name} ${round1(top.allRate)}% • 14D ${round1(top.windows['14'].rate)}% • 30D ${round1(top.windows['30'].rate)}% • Pro ${top.proScore} • ${confidence} CONFIDENCE`};
    return evidenceAuthorityReady ? writeLock(targetDate,id,fingerprint,decision,'confirmed') : {...decision,locked:false,provisional:true,lockState:'provisional'};
  }

  function formatUi(profileId,decision){
    const d=decision||decide(profileId), mode=String(d?.mode||'original');
    if(!d?.ready && !d?.hydrating && d?.confidenceLabel==='WARMUP'){
      const n=Number(d?.warmupCount||Math.max(Number(d?.classicTrustedAll||0),Number(d?.p18Samples||0),Number(d?.p19Samples||0),Number(d?.x3Samples||0)));
      return {mode:'pending',badge:'AUTO V4 • WARMUP',detail:`Profile นี้มี Trusted ${n}/${MIN_TOTAL} • ยังไม่สร้าง Daily Lock`,button:'AUTO • WARMUP'};
    }
    if(d?.hydrating){
      const x3Wins=String(d?.mode||'')==='x3';
      return {mode:'pending',badge:x3Wins?'AUTO → X3':'AUTO',
        detail:x3Wins?`X3 นำจาก Prior-only • รอ runtime ก่อน Lock • PRO ${Number(d.proScore||0).toFixed(1)}`:'กำลังคืนค่า History authority • ยังไม่สร้าง Daily Lock',
        button:x3Wins?'AUTO • X3':'AUTO'};
    }
    const label=k=>shortName(k);
    if(mode==='combo'){
      const a=d.comboSources?.[0]||'original',b=d.comboSources?.[1]||'ai';
      return {mode:'combo',badge:`AUTO → ${label(a)} + ${label(b)}`,detail:`PRO ${Number(d.proScore||0).toFixed(1)} • ${d.confidenceLabel||'MEDIUM'} • Strict Prior-only • COMBO${d?.engineAvailability?.x3==='loading'?' • X3 BG':''}`,button:`AUTO • ${label(a)} + ${label(b)}`};
    }
    return {mode,badge:`AUTO → ${label(mode)}`,detail:`HIST ${Number((d?.[mode==='original'?'classicRate':mode==='ai'?'aiRate':mode==='gl'?'glRate':mode==='pattern'?'p18Rate':mode==='p19'?'p19Rate':'x3Rate'])||0).toFixed(1)}% • 14D ${Number(d.recent14Rate||0).toFixed(1)}% • 30D ${Number(d.recent30Rate||0).toFixed(1)}% • ${d.confidenceLabel||'MEDIUM'} • PROFILE ONLY`,button:`AUTO • ${label(mode)}`};
  }

  global.LuckyAutoRouteV2=Object.freeze({ENGINE_VERSION,LOCK_KEY,MIN_TOTAL,decide,formatUi,_test:{fnv1a,normalizeStatus,isHit,isVariant,buildStatusRows,summarizeStatusRows,weightedEvidence,rankCandidates,sourceFingerprint}});
})(globalThis);
