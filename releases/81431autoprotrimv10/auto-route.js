/* LuckyNumber V8.14.31.10 — AUTO ROUTE PRO REWRITE
 * Single-authority selector. Legacy AUTO branches are removed from the active path.
 * Invariants:
 *  - one Profile + one target date = one immutable decision
 *  - strict prior-only data only
 *  - same trusted History authority used by History/Analysis
 *  - 7/14/30 multi-window consensus, deterministic tie-break
 *  - no fabricated CLS fallback when evidence is unavailable
 *  - Refresh / tab switch / resume / X3 hydration can never rerank a locked day
 */
(function(global){
  'use strict';

  const ENGINE_VERSION='AUTO_ROUTE_PRO_TRIM_8143110';
  const LOCK_KEY='luckyNumber_auto_route_pro_trim_8143110';
  const MIN_LOCK_TOTAL=7;
  const WINDOWS=Object.freeze([
    {name:'7',size:7,weight:0.45},
    {name:'14',size:14,weight:0.35},
    {name:'30',size:30,weight:0.20}
  ]);
  const KEYS=Object.freeze(['x3','p19','pattern','original','ai','gl']);
  const PRIORITY=Object.freeze({x3:0,p19:1,pattern:2,original:3,ai:4,gl:5});

  const round1=n=>Math.round((Number(n)||0)*10)/10;
  const pct=n=>`${round1(n).toFixed(1)}%`;
  const shortName=k=>k==='pattern'?'P18':k==='original'?'CLS':k==='ai'?'AIL':k==='gl'?'GL':String(k||'').toUpperCase();
  const fullName=k=>k==='pattern'?'P18':k==='original'?'Classic L':k==='ai'?'AI L':k==='gl'?'AI GL':String(k||'').toUpperCase();

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
    }catch(_){/* persistence failure must not block calculation */}
    return decision;
  }

  function summaryFor(draws,id,key){
    try{
      let s=null;
      if(key==='original') s=trustedHistorySummary(draws,id,'classic');
      else if(key==='ai') s=trustedHistorySummary(draws,id,'aiL');
      else if(key==='gl') s=trustedHistorySummary(draws,id,'gl');
      else if(key==='pattern') s=patternV18TrustedHistorySummary(draws,id);
      else if(key==='p19') s=patternV19TrustedHistorySummary(draws,id);
      else if(key==='x3') s=x3TrustedHistorySummary(draws,id);
      return {rate:round1(s?.rate||0),total:Number(s?.total||0)};
    }catch(_){return {rate:0,total:0};}
  }

  function modelAvailability(id,targetDate){
    const saved=state.aiFormulaLab?.[id]||null,glSaved=state.aiGLFormulaLab?.[id]||null;
    const localDate=ts=>{const n=Number(ts||0);if(!n)return'';try{const d=new Date(n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}catch(_){return'';}};
    const aiCreated=localDate(saved?.createdAt||saved?.autoLearnedAt),glCreated=localDate(glSaved?.createdAt||glSaved?.autoLearnedAt);
    let aiAllowed=false,glAllowed=false;
    try{ aiAllowed=Boolean(saved?.formula&&(!aiCreated||aiCreated<targetDate)&&formulaEligibility(saved).allowed); }catch(_){ aiAllowed=Boolean(saved?.formula&&(!aiCreated||aiCreated<targetDate)); }
    try{ glAllowed=Boolean(glSaved?.formula&&(!glCreated||glCreated<targetDate)); }catch(_){ glAllowed=false; }
    return {aiAllowed,glAllowed};
  }

  function buildEvidence(prior,id,targetDate){
    const {aiAllowed,glAllowed}=modelAvailability(id,targetDate);
    const evidence={};
    for(const key of KEYS){
      const windows={};
      for(const w of WINDOWS){ windows[w.name]=summaryFor(prior.slice(-w.size),id,key); }
      windows.all=summaryFor(prior,id,key);
      evidence[key]={key,windows,allRate:windows.all.rate,total:windows.all.total};
    }
    // Formula-backed engines must be executable today. Result-only engines do not need a live formula object.
    evidence.ai.allowed=aiAllowed;
    evidence.gl.allowed=glAllowed;
    evidence.original.allowed=true;
    evidence.pattern.allowed=true;
    evidence.p19.allowed=true;
    evidence.x3.allowed=true;
    return evidence;
  }

  function availableCandidates(evidence){
    return KEYS.map(k=>evidence[k]).filter(e=>e?.allowed&&Number(e?.total||0)>0);
  }

  function compareForWindow(a,b,windowName){
    const aw=a.windows[windowName]||{},bw=b.windows[windowName]||{};
    return Number(bw.rate||0)-Number(aw.rate||0) || Number(bw.total||0)-Number(aw.total||0) || Number(PRIORITY[a.key]??99)-Number(PRIORITY[b.key]??99);
  }
  function windowChampion(candidates,windowName){
    const pool=candidates.filter(c=>Number(c.windows?.[windowName]?.total||0)>0);
    return pool.sort((a,b)=>compareForWindow(a,b,windowName))[0]||null;
  }

  function scoreCandidate(c,champions){
    let weighted=0,weightSum=0;
    for(const w of WINDOWS){
      const s=c.windows[w.name]||{};
      if(Number(s.total||0)<=0) continue;
      const coverage=Math.min(1,Number(s.total||0)/w.size);
      const effective=w.weight*(0.65+0.35*coverage);
      weighted+=Number(s.rate||0)*effective; weightSum+=effective;
    }
    const base=weightSum?weighted/weightSum:0;
    const votes=WINDOWS.reduce((n,w)=>n+(champions[w.name]?.key===c.key?1:0),0);
    // Consensus is a small deterministic bonus; it cannot manufacture performance.
    const proScore=base + votes*1.5;
    return {...c,votes,baseScore:round1(base),proScore:round1(proScore)};
  }

  function rank(evidence){
    const candidates=availableCandidates(evidence);
    const champions={};
    for(const w of WINDOWS) champions[w.name]=windowChampion([...candidates],w.name);
    const ranked=candidates.map(c=>scoreCandidate(c,champions)).sort((a,b)=>
      Number(b.votes||0)-Number(a.votes||0) ||
      Number(b.proScore||0)-Number(a.proScore||0) ||
      Number(b.allRate||0)-Number(a.allRate||0) ||
      Number(b.total||0)-Number(a.total||0) ||
      Number(PRIORITY[a.key]??99)-Number(PRIORITY[b.key]??99)
    );
    return {ranked,champions};
  }

  function decide(profileId){
    const id=Number(profileId),targetDate=autoRouteTargetDate();
    const locked=readLock(targetDate,id);
    if(locked) return {...locked,locked:true,lockReused:true};

    const prior=(state.actualDraws||[])
      .filter(d=>Number(d?.profileId??0)===id&&String(d?.date||'')<String(targetDate))
      .sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
    const evidence=buildEvidence(prior,id,targetDate);
    const {ranked,champions}=rank(evidence);
    const top=ranked[0]||null;

    const base={
      selectorVersion:ENGINE_VERSION,targetDate,strictPriorOnly:true,trustedOnly:true,
      evidenceSource:'HISTORY_TRUSTED_AUTHORITY',minSamples:MIN_LOCK_TOTAL,
      classicRate:round1(evidence.original.allRate),aiRate:round1(evidence.ai.allRate),glRate:round1(evidence.gl.allRate),
      p18Rate:round1(evidence.pattern.allRate),p19Rate:round1(evidence.p19.allRate),x3Rate:round1(evidence.x3.allRate),
      classicTrustedAll:evidence.original.total,aiTrustedAll:evidence.ai.total,glTrustedAll:evidence.gl.total,
      p18Samples:evidence.pattern.total,p19Samples:evidence.p19.total,x3Samples:evidence.x3.total,
      engineAvailability:Object.fromEntries(KEYS.map(k=>[k,evidence[k].allowed?(evidence[k].total?'ready':'no-evidence'):'unavailable'])),
      windowChampions:Object.fromEntries(WINDOWS.map(w=>[w.name,champions[w.name]?.key||null])),
      candidatePool:ranked.map(x=>x.key)
    };

    if(!top){
      return {...base,mode:'original',ready:false,hydrating:true,locked:false,provisional:true,confidenceLabel:'WAIT DATA',
        recent7Rate:0,recent14Rate:0,recent30Rate:0,consensusVotes:0,proScore:0,
        reason:'ยังไม่มี Trusted Prior-only evidence • ไม่สร้าง CLS fallback และไม่สร้าง Daily Lock'};
    }

    const top7=top.windows['7']||{},top14=top.windows['14']||{},top30=top.windows['30']||{};
    const sufficient=Number(top.total||0)>=MIN_LOCK_TOTAL;
    const second=ranked[1]||null;
    const scoreGap=second?round1(Number(top.proScore||0)-Number(second.proScore||0)):99;
    const confidence=top.votes>=2&&scoreGap>=2?'HIGH':top.votes>=2?'MEDIUM':'LOW';
    const x3RuntimeReady=Boolean(globalThis.X3NestedPro463);
    const runtimeBlocked=top.key==='x3'&&!x3RuntimeReady;
    const decision={...base,mode:top.key,ready:true,hydrating:false,locked:false,provisional:!sufficient||runtimeBlocked,
      confidenceLabel:!sufficient?'WARMUP':runtimeBlocked?'SELECTED':confidence,
      consensusVotes:Number(top.votes||0),proScore:round1(top.proScore),scoreGap,
      recent7Rate:round1(top7.rate),recent14Rate:round1(top14.rate),recent30Rate:round1(top30.rate),
      recent7Samples:Number(top7.total||0),recent14Samples:Number(top14.total||0),recent30Samples:Number(top30.total||0),
      weightedRate:round1(top.baseScore),
      reason:`AUTO PRO • ${fullName(top.key)} • 7D ${pct(top7.rate)} • 14D ${pct(top14.rate)} • 30D ${pct(top30.rate)} • CONSENSUS ${top.votes}/3 • Strict Prior-only`};

    // No lock until the winner has enough trusted prior evidence and its result engine is executable.
    if(!sufficient||runtimeBlocked) return decision;
    return writeLock(targetDate,id,{...decision,locked:true,provisional:false});
  }

  function formatUi(profileId,decision){
    const d=decision||decide(profileId),mode=String(d?.mode||'original');
    if(!d?.ready){
      return {mode:'pending',badge:'AUTO PRO • WAIT DATA',detail:'รอ Trusted Prior-only • ไม่ fallback CLS • ยังไม่ Daily Lock',button:'AUTO • WAIT DATA'};
    }
    const lockText=d.locked?'LOCKED':d.confidenceLabel==='WARMUP'?'WARMUP':'SELECTING';
    return {
      mode,
      badge:`AUTO → ${shortName(mode)}`,
      detail:`7D ${pct(d.recent7Rate)} • 14D ${pct(d.recent14Rate)} • 30D ${pct(d.recent30Rate)} • CONSENSUS ${Number(d.consensusVotes||0)}/3 • ${lockText}`,
      button:`AUTO • ${shortName(mode)}`
    };
  }

  global.LuckyAutoRouteV2=Object.freeze({
    ENGINE_VERSION,LOCK_KEY,MIN_TOTAL:MIN_LOCK_TOTAL,decide,formatUi,
    _test:{summaryFor,buildEvidence,availableCandidates,windowChampion,scoreCandidate,rank,readLock,writeLock}
  });
})(globalThis);
