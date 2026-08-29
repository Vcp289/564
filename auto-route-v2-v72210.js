/* LuckyNumber V7.22.10 — AUTO Route V2 PRO
 * NEW ENGINE. The V7.22.06 selector is intentionally retained in app-v72210.js as fallback.
 * Contract: strict prior-only evidence, deterministic scoring, versioned evidence lock,
 * no same-day result leakage, no lock while hydration is incomplete.
 */
(function(global){
  'use strict';

  const ENGINE_VERSION='AUTO_ROUTE_V2_PRO_1';
  const LOCK_KEY='luckyNumber_auto_route_v2_lock_v72210';
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
  function sourceFingerprint(draws,targetDate,profileId){
    const body=(draws||[]).map(d=>[
      Number(d?.profileId??0),String(d?.date||''),String(d?.number||''),String(d?.twoDigit||'')
    ].join(':')).join('|');
    return fnv1a(`${ENGINE_VERSION}|${Number(profileId)}|${String(targetDate)}|${body}`);
  }
  function loadBox(){
    try{
      const raw=JSON.parse(localStorage.getItem(LOCK_KEY)||'null');
      return raw&&raw.schema===2&&raw.engineVersion===ENGINE_VERSION?raw:{schema:2,engineVersion:ENGINE_VERSION,dates:{}};
    }catch(_){ return {schema:2,engineVersion:ENGINE_VERSION,dates:{}}; }
  }
  function readLock(targetDate,profileId,fingerprint){
    try{
      const box=loadBox();
      const item=box?.dates?.[String(targetDate)]?.[String(Number(profileId))];
      if(!item) return null;
      if(item.engineVersion!==ENGINE_VERSION||item.fingerprint!==fingerprint) return null;
      if(item.targetDate!==String(targetDate)||Number(item.profileId)!==Number(profileId)) return null;
      return item.decision||null;
    }catch(_){ return null; }
  }
  function writeLock(targetDate,profileId,fingerprint,decision){
    try{
      const box=loadBox(), date=String(targetDate), pid=String(Number(profileId));
      box.dates=box.dates||{}; box.dates[date]=box.dates[date]||{};
      box.dates[date][pid]={targetDate:date,profileId:Number(profileId),engineVersion:ENGINE_VERSION,fingerprint,createdAt:Date.now(),decision};
      const dates=Object.keys(box.dates).sort();
      while(dates.length>14) delete box.dates[dates.shift()];
      localStorage.setItem(LOCK_KEY,JSON.stringify(box));
    }catch(_){ /* lock failure must never block Calculate */ }
    return decision;
  }

  function isHit(status){ return status==='exact'||status==='reversed'; }
  function buildStatusRows(draws,id){
    const rows=[];
    for(const draw of (draws||[])){
      let c=null,p18='pending',p19='pending',x3='pending';
      try{ c=getHistoryComparisonStatuses(draw,id)||null; }catch(_){}
      try{ p18=patternV18HistoryStatus(draw,id)||'pending'; }catch(_){}
      try{ p19=patternV19HistoryStatus(draw,id)||'pending'; }catch(_){}
      try{ x3=x3HistoryStatus(draw,id)||'pending'; }catch(_){}
      rows.push({
        original:c?.classic||'pending',ai:c?.aiL||'pending',gl:c?.gl||'pending',
        pattern:p18,p19,x3
      });
    }
    return rows;
  }
  function summarizeStatusRows(rows,key){
    let hit=0,total=0;
    for(const row of (rows||[])){
      const status=row?.[key]||'pending'; if(status==='pending') continue;
      total++; if(isHit(status)) hit++;
    }
    return {rate:total?Math.round(hit*1000/total)/10:0,total};
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
    return [...candidates].sort((a,b)=>
      Number(b.proScore||0)-Number(a.proScore||0) ||
      Number(b.weightedRate||0)-Number(a.weightedRate||0) ||
      Number(b.total||0)-Number(a.total||0) ||
      Number(PRIORITY[a.key]??99)-Number(PRIORITY[b.key]??99)
    );
  }

  function decide(profileId){
    const id=Number(profileId), targetDate=autoRouteTargetDate();
    if(!autoRouteEvidenceReady(id)){
      return {selectorVersion:ENGINE_VERSION,targetDate,strictPriorOnly:true,mode:'original',ready:false,hydrating:true,locked:false,
        reason:'กำลังโหลด Trusted / WF / X3 • AUTO V2 ยังไม่สร้าง lock',lowConfidence:false,
        classicRate:0,aiRate:0,glRate:0,p18Rate:0,p19Rate:0,x3Rate:0,candidatePool:[]};
    }

    // THE anti-leak boundary. No function below receives targetDate or future rows.
    const prior=(state.actualDraws||[])
      .filter(d=>Number(d?.profileId??0)===id && String(d?.date||'')<String(targetDate))
      .sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
    const fingerprint=sourceFingerprint(prior,targetDate,id);
    const locked=readLock(targetDate,id,fingerprint);
    if(locked) return {...locked,locked:true,lockReused:true};

    const saved=state.aiFormulaLab?.[id]||null, glSaved=state.aiGLFormulaLab?.[id]||null;
    const aiCreated=localDateFromTimestamp(saved?.createdAt||saved?.autoLearnedAt);
    const glCreated=localDateFromTimestamp(glSaved?.createdAt||glSaved?.autoLearnedAt);
    const aiModelPrior=!aiCreated||aiCreated<targetDate;
    const glModelPrior=!glCreated||glCreated<targetDate;

    const keys=['original','ai','gl','pattern','p19','x3'];
    // One strict-prior status pass only. All 14/30/60/All windows are aggregated from this immutable row set.
    // This prevents 24 repeated history/model scans on iPhone and keeps AUTO V2 deterministic.
    const statusRows=buildStatusRows(prior,id);
    const evidence={};
    for(const key of keys){
      const windows=collectWindowsFromRows(statusRows,key), pro=weightedEvidence(windows);
      evidence[key]={key,name:engineName(key),windows,...pro,total:Number(windows.all?.total||0),allRate:Number(windows.all?.rate||0)};
    }

    const aiAllowed=Boolean(saved?.formula&&aiModelPrior&&formulaEligibility(saved).allowed);
    const glComparable=Math.min(Number(evidence.ai.total||0),Number(evidence.gl.total||0));
    const glAllowed=Boolean(glSaved?.formula&&glModelPrior&&glComparable>=8&&Number(evidence.gl.allRate||0)>=Number(evidence.ai.allRate||0));

    const eligible=evidence.original.total>=MIN_TOTAL ? [evidence.original] : [];
    if(aiAllowed&&evidence.ai.total>=MIN_TOTAL) eligible.push(evidence.ai);
    if(glAllowed&&evidence.gl.total>=MIN_TOTAL) eligible.push(evidence.gl);
    if(evidence.pattern.total>=MIN_TOTAL) eligible.push(evidence.pattern);
    if(evidence.p19.total>=MIN_TOTAL) eligible.push(evidence.p19);
    if(evidence.x3.total>=MIN_TOTAL) eligible.push(evidence.x3);

    const common={selectorVersion:ENGINE_VERSION,targetDate,strictPriorOnly:true,evidenceFingerprint:fingerprint,minSamples:MIN_TOTAL,trustedOnly:true,
      classicRate:round1(evidence.original.allRate),aiRate:round1(evidence.ai.allRate),glRate:round1(evidence.gl.allRate),
      p18Rate:round1(evidence.pattern.allRate),p19Rate:round1(evidence.p19.allRate),x3Rate:round1(evidence.x3.allRate),
      classicTrustedAll:evidence.original.total,aiTrustedAll:evidence.ai.total,glTrustedAll:evidence.gl.total,
      p18Samples:evidence.pattern.total,p19Samples:evidence.p19.total,x3Samples:evidence.x3.total,
      evidenceWindows:Object.fromEntries(keys.map(k=>[k,evidence[k].windows]))};

    if(evidence.original.total<MIN_TOTAL || eligible.length===0){
      const decision={...common,mode:'original',ready:false,lowConfidence:true,locked:true,confidenceLabel:'LOW',proScore:round1(evidence.original.score),
        recent14Rate:round1(evidence.original.windows['14'].rate),recent30Rate:round1(evidence.original.windows['30'].rate),
        candidatePool:['original'],reason:`Trusted ${evidence.original.total}/${MIN_TOTAL} • ใช้ Classic L จนกว่าจะมี sample พอ`};
      return writeLock(targetDate,id,fingerprint,decision);
    }

    const ranked=rankCandidates(eligible), top=ranked[0], second=ranked[1]||null;
    const scoreGap=second?round1(top.proScore-second.proScore):99;
    const low=Number(top.proScore||0)<LOW_CONFIDENCE_SCORE || Number(top.total||0)<20;
    const confidence=low?'LOW':(scoreGap>=3&&top.sampleConfidence>=70?'HIGH':'MEDIUM');

    // COMBO is allowed only when both leaders are genuinely indistinguishable after Pro scoring.
    // This is stricter than the old raw-rate 0.5/1.0pp rule and prevents frequent route flapping.
    if(second){
      const weightedGap=round1(Math.abs(top.weightedRate-second.weightedRate));
      const stablePair=top.total>=MIN_TOTAL&&second.total>=MIN_TOTAL&&top.volatility<=10&&second.volatility<=10;
      const comboReady=stablePair&&scoreGap<=0.4&&weightedGap<=0.7;
      if(comboReady){
        const pairKeyPart=k=>k==='original'?'classic':k==='ai'?'ai':k;
        const pair=[pairKeyPart(top.key),pairKeyPart(second.key)].sort();
        const decision={...common,mode:'combo',ready:true,locked:true,lowConfidence:low,confidenceLabel:confidence,
          comboSources:[top.key,second.key],comboPair:pair.join('-'),comboLabel:`${top.name} + ${second.name}`,comboGap:weightedGap,comboBaseMode:top.key,
          proScore:round1(top.proScore),recent14Rate:round1(top.windows['14'].rate),recent30Rate:round1(top.windows['30'].rate),
          weightedRate:round1(top.weightedRate),stability:round1(top.volatility),scoreGap,candidatePool:ranked.map(x=>x.key),
          reason:`AUTO V2 • ${top.name} ${top.proScore} + ${second.name} ${second.proScore} Pro Score • gap ${scoreGap} • stable pair → COMBO`};
        return writeLock(targetDate,id,fingerprint,decision);
      }
    }

    const decision={...common,mode:top.key,ready:true,locked:true,lowConfidence:low,confidenceLabel:confidence,
      proScore:round1(top.proScore),recent14Rate:round1(top.windows['14'].rate),recent30Rate:round1(top.windows['30'].rate),recent60Rate:round1(top.windows['60'].rate),
      weightedRate:round1(top.weightedRate),stability:round1(top.volatility),sampleConfidence:round1(top.sampleConfidence),scoreGap,
      candidatePool:ranked.map(x=>x.key),
      reason:`AUTO V2 • ${top.name} Pro Score ${top.proScore} • 14D ${round1(top.windows['14'].rate)}% • 30D ${round1(top.windows['30'].rate)}% • All ${round1(top.allRate)}% • ${confidence} CONFIDENCE`};
    return writeLock(targetDate,id,fingerprint,decision);
  }

  function formatUi(profileId,decision){
    const d=decision||decide(profileId), mode=String(d?.mode||'original');
    if(d?.hydrating) return {mode:'pending',badge:'AUTO V2 • WAIT DATA',detail:'กำลังคืนค่า Trusted / WF / X3 • ยังไม่สร้าง Daily Lock',button:'AUTO • WAIT DATA'};
    const label=k=>shortName(k);
    if(mode==='combo'){
      const a=d.comboSources?.[0]||'original',b=d.comboSources?.[1]||'ai';
      return {mode:'combo',badge:`AUTO → ${label(a)} + ${label(b)}`,detail:`PRO ${Number(d.proScore||0).toFixed(1)} • ${d.confidenceLabel||'MEDIUM'} • Strict Prior-only • COMBO`,button:`AUTO • ${label(a)} + ${label(b)}`};
    }
    return {mode,badge:`AUTO → ${label(mode)}`,detail:`PRO ${Number(d.proScore||0).toFixed(1)} • 14D ${Number(d.recent14Rate||0).toFixed(1)}% • 30D ${Number(d.recent30Rate||0).toFixed(1)}% • ${d.confidenceLabel||'MEDIUM'}`,button:`AUTO • ${label(mode)}`};
  }

  global.LuckyAutoRouteV2=Object.freeze({ENGINE_VERSION,LOCK_KEY,MIN_TOTAL,decide,formatUi,_test:{fnv1a,weightedEvidence,rankCandidates,sourceFingerprint}});
})(globalThis);
