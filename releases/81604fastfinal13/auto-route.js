(function(global){
'use strict';
const ENGINE_VERSION='AUTO_ROUTE_V5_EXACT_ANALYSIS_AUTHORITY_NPLUS1_X4FIX';
const LOCK_KEY='luckyNumber_auto_route_v5_lock_v81605_x4fix';
const MIN_TOTAL=30;
const LOW_CONFIDENCE_SCORE=20;
const PRIORITY=Object.freeze({x4:0,p19:1,x3:2,pattern:3,gl:4,ai:5,original:6});
const WINDOWS=Object.freeze([
{name:'14',size:14,weight:0.35},
{name:'30',size:30,weight:0.30},
{name:'60',size:60,weight:0.20},
{name:'all',size:0,weight:0.15}
]);
function round1(n){return Math.round((Number(n)||0)*10)/10;}
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0));}
function fnv1a(text){
let h=0x811c9dc5;
const s=String(text||'');
for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}
return(h>>>0).toString(16).padStart(8,'0');
}
function normalizeStatus(status){
const s=String(status||'pending').toLowerCase();
if(['exact','hit'].includes(s))return'exact';
if(['reversed','reverse','rev','swap'].includes(s))return s==='swap'?'swap':'reversed';
if(['notfound','miss'].includes(s))return'miss';
return'pending';
}
function sourceFingerprint(draws,targetDate,profileId,statusRows=[]){
const body=(draws||[]).map((d,i)=>{
const r=statusRows?.[i]||{};
const evidence=['original','ai','gl','pattern','p19','x3','x4'].map(k=>normalizeStatus(r?.[k])).join(',');
return[Number(d?.profileId??0),String(d?.date||''),String(d?.number||''),String(d?.twoDigit||''),evidence].join(':');
}).join('|');
return fnv1a(`${ENGINE_VERSION}|${Number(profileId)}|${String(targetDate)}|${body}`);
}
function loadBox(){
try{
const raw=JSON.parse(localStorage.getItem(LOCK_KEY)||'null');
return raw&&raw.schema===2&&raw.engineVersion===ENGINE_VERSION?raw:{schema:2,engineVersion:ENGINE_VERSION,dates:{}};
}catch(_){return{schema:2,engineVersion:ENGINE_VERSION,dates:{}};}
}
function readLockItem(targetDate,profileId){
try{
const box=loadBox();
const item=box?.dates?.[String(targetDate)]?.[String(Number(profileId))];
if(!item)return null;
if(item.engineVersion!==ENGINE_VERSION)return null;
if(item.targetDate!==String(targetDate)||Number(item.profileId)!==Number(profileId))return null;
return item;
}catch(_){return null;}
}
function readConfirmedLock(targetDate,profileId){
const item=readLockItem(targetDate,profileId);
if(!item||item.lockState!=='confirmed')return null;
return item.decision||null;
}
function writeLock(targetDate,profileId,fingerprint,decision,lockState='confirmed'){
try{
const box=loadBox(),date=String(targetDate),pid=String(Number(profileId));
box.dates=box.dates||{};box.dates[date]=box.dates[date]||{};
const prev=box.dates[date][pid]||null;
if(prev?.lockState==='confirmed'&&prev?.engineVersion===ENGINE_VERSION)return prev.decision||decision;
box.dates[date][pid]={targetDate:date,profileId:Number(profileId),engineVersion:ENGINE_VERSION,fingerprint,lockState,createdAt:prev?.createdAt||Date.now(),updatedAt:Date.now(),decision};
const dates=Object.keys(box.dates).sort();
while(dates.length>14)delete box.dates[dates.shift()];
localStorage.setItem(LOCK_KEY,JSON.stringify(box));
}catch(_){}
return decision;
}
function isHit(status){return normalizeStatus(status)==='exact';}
function isVariant(status){const s=normalizeStatus(status);return s==='reversed'||s==='swap';}
function buildStatusRows(draws,id){
const rows=[];
for(const draw of(draws||[])){
try{
const unified=global.LuckyEngineRegistry?.statusesForAuto?.(draw,id);
if(unified){
rows.push({original:normalizeStatus(unified.original),ai:normalizeStatus(unified.ai),gl:normalizeStatus(unified.gl),pattern:normalizeStatus(unified.pattern),p19:normalizeStatus(unified.p19),x3:normalizeStatus(unified.x3),x4:normalizeStatus(unified.x4)});
continue;
}
}catch(_){}
let h=null;
try{h=getHistoryRouteAStatuses(draw,id,{display:true})||null;}catch(_){}
if(!h){
try{h=getUnifiedAIHistoryStatuses(draw,id,{display:true})||null;}catch(_){}
}
if(!h){
try{h=getHistoryComparisonStatuses(draw,id)||null;}catch(_){}
}
rows.push({
original:normalizeStatus(h?.classic),
ai:normalizeStatus(h?.aiL),
gl:normalizeStatus(h?.gl),
pattern:normalizeStatus(h?.p18),
p19:normalizeStatus(h?.p19),
x3:normalizeStatus(h?.x3),
x4:normalizeStatus(h?.x4)
});
}
return rows;
}
function summarizeStatusRows(rows,key){
let hit=0,variants=0,total=0;
for(const row of(rows||[])){
const status=row?.[key]||'pending';if(status==='pending')continue;
total++;if(isHit(status))hit++;else if(isVariant(status))variants++;
}
const combinedHit=hit+variants;
return{rate:total?Math.round(combinedHit*1000/total)/10:0,total,exact:hit,variants,
exactOnlyRate:total?Math.round(hit*1000/total)/10:0,
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
if(Number(x.total||0)<=0)continue;
const coverage=w.size>0?clamp(Number(x.total||0)/Math.min(w.size,MIN_TOTAL),0.25,1):1;
const effective=w.weight*coverage;
numerator+=Number(x.rate||0)*effective;weightSum+=effective;
usable.push(Number(x.rate||0));
}
const weighted=weightSum?numerator/weightSum:0;
const mean=usable.length?usable.reduce((a,b)=>a+b,0)/usable.length:0;
const variance=usable.length?usable.reduce((a,b)=>a+Math.pow(b-mean,2),0)/usable.length:0;
const volatility=Math.sqrt(variance);
const total=Number(windows.all?.total||0);
const sampleConfidence=clamp(Math.sqrt(Math.min(total,60)/60),0,1);
const score=weighted*(0.82+0.18*sampleConfidence)-Math.min(4,volatility*0.22);
return{weightedRate:round1(weighted),volatility:round1(volatility),sampleConfidence:round1(sampleConfidence*100),proScore:round1(score)};
}
function localDateFromTimestamp(ts){
const n=Number(ts||0);if(!n)return'';
try{const d=new Date(n);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}catch(_){return'';}
}
function engineName(key){return key==='x4'?'X4':key==='x3'?'X3':key==='p19'?'P19':key==='pattern'?'P18':key==='gl'?'AI GL':key==='ai'?'AI L':'Classic L';}
function shortName(key){return key==='pattern'?'P18':key==='gl'?'GL':key==='ai'?'AIL':key==='original'?'CLS':String(key||'').toUpperCase();}
function rankCandidates(candidates){
return[...candidates].sort((a,b)=>
Number(b.allRate||0)-Number(a.allRate||0)||
Number(b.total||0)-Number(a.total||0)||
Number(b.proScore||0)-Number(a.proScore||0)||
Number(PRIORITY[a.key]??99)-Number(PRIORITY[b.key]??99)
);
}
const DECISION_MEMO_STORAGE_KEY='luckyNumber_autoRouteDecisionMemo_v1';
const DECISION_MEMO_STORAGE_MAX=200;
const DECISION_MEMO=new Map();
(function hydrateDecisionMemoFromStorage(){
try{
const raw=localStorage.getItem(DECISION_MEMO_STORAGE_KEY);
if(!raw)return;
const parsed=JSON.parse(raw);
if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
for(const key of Object.keys(parsed))DECISION_MEMO.set(key,parsed[key]);
}
}catch(_){}
})();
let decisionMemoWriteTimer=null;
function persistDecisionMemoSoon(){
clearTimeout(decisionMemoWriteTimer);
decisionMemoWriteTimer=setTimeout(()=>{
try{
const obj={};
for(const[key,value]of DECISION_MEMO.entries())obj[key]=value;
localStorage.setItem(DECISION_MEMO_STORAGE_KEY,JSON.stringify(obj));
}catch(_){}
},250);
}
function decisionMemoKey(id,targetDate,fingerprint){return`${id}|${targetDate}|${fingerprint}`;}
function decisionMemoSet(key,value){
DECISION_MEMO.set(key,value);
if(DECISION_MEMO.size>DECISION_MEMO_STORAGE_MAX){const oldest=DECISION_MEMO.keys().next().value;DECISION_MEMO.delete(oldest);}
persistDecisionMemoSoon();
return value;
}
function decide(profileId){
const id=Number(profileId),targetDate=autoRouteTargetDate(id);
const evidenceAuthorityReady=Boolean(autoRouteEvidenceReady(id));
const confirmedLock=readConfirmedLock(targetDate,id);
if(confirmedLock)return{...confirmedLock,locked:true,provisional:false,lockState:'confirmed',lockReused:true,restoredAfterLaunch:true};
const prior=(state.actualDraws||[])
.filter(d=>Number(d?.profileId??0)===id&&String(d?.date||'')<String(targetDate))
.sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
const statusRows=buildStatusRows(prior,id);
const fingerprint=sourceFingerprint(prior,targetDate,id,statusRows);
const memoKey=decisionMemoKey(id,targetDate,fingerprint);
if(DECISION_MEMO.has(memoKey))return DECISION_MEMO.get(memoKey);
const remember=value=>decisionMemoSet(memoKey,value);
const saved=state.aiFormulaLab?.[id]||null,glSaved=state.aiGLFormulaLab?.[id]||null;
const aiCreated=localDateFromTimestamp(saved?.createdAt||saved?.autoLearnedAt);
const glCreated=localDateFromTimestamp(glSaved?.createdAt||glSaved?.autoLearnedAt);
const aiModelPrior=!aiCreated||aiCreated<targetDate;
const glModelPrior=!glCreated||glCreated<targetDate;
const keys=['original','ai','gl','pattern','p19','x3','x4'];
const evidence={};
for(const key of keys){
const windows=collectWindowsFromRows(statusRows,key),pro=weightedEvidence(windows);
evidence[key]={key,name:engineName(key),windows,...pro,total:Number(windows.all?.total||0),allRate:Number(windows.all?.rate||0)};
}
let authority=null;
try{
authority=(typeof getAutoRouteAnalysisAuthority==='function')
?getAutoRouteAnalysisAuthority(id,targetDate,prior)
:historyChampionForPriorDraws(prior,id);
}catch(error){
authority=null;
try{if(typeof globalThis.logAutoRouteEngineError==='function')globalThis.logAutoRouteEngineError(id,targetDate,error);}catch(_){}
console.error('AUTO Route authority lookup failed — falling back to local evidence only',{profileId:id,targetDate,error});
}
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
.filter(x=>['original','ai','gl','pattern','p19','x3','x4'].includes(x.key)&&x.total>0);
const authorityByKey=new Map(authorityItems.map(x=>[x.key,x]));
for(const key of keys){
const a=authorityByKey.get(key);
if(a){evidence[key].allRate=a.allRate;evidence[key].total=a.total;evidence[key].authorityHit=a.hit;evidence[key].championScore=a.championScore;}
}
const authorityWinnerRaw=authority?.winner||null;
const authorityWinnerKey=authorityWinnerRaw?.key==='p18'?'pattern':authorityWinnerRaw?.key;
const authorityWinner=authorityWinnerKey?authorityByKey.get(authorityWinnerKey)||null:null;
const aiAllowed=Boolean(saved?.formula&&aiModelPrior&&formulaEligibility(saved).allowed);
const glComparable=Math.min(Number(evidence.ai.total||0),Number(evidence.gl.total||0));
const glAllowed=Boolean(glSaved?.formula&&glModelPrior&&glComparable>=8&&Number(evidence.gl.allRate||0)>=Number(evidence.ai.allRate||0));
const x3RuntimeReady=Boolean(globalThis.X3NestedPro463);
const recentCoverage=(key)=>Number(evidence?.[key]?.windows?.['14']?.total||0);
const expectedRecent=Math.min(MIN_TOTAL,prior.length);
const coreAuthority={
original:recentCoverage('original'),
pattern:recentCoverage('pattern'),
p19:recentCoverage('p19'),
x3:recentCoverage('x3'),
x4:recentCoverage('x4')
};
const coreAuthorityReady=true;
const eligible=authorityItems
.filter(x=>x.total>=MIN_TOTAL)
.map(x=>({...evidence[x.key],championScore:x.championScore,authorityHit:x.hit}));
const common={selectorVersion:ENGINE_VERSION,targetDate,strictPriorOnly:true,evidenceFingerprint:fingerprint,minSamples:MIN_TOTAL,trustedOnly:true,
authoritySource:String(authority?.authoritySource||'historyChampionForPriorDraws/buildHistoryChampionSummary'),
authoritySourceVersion:2,
authorityWinner:authorityWinnerKey||null,
classicRate:round1(evidence.original.allRate),aiRate:round1(evidence.ai.allRate),glRate:round1(evidence.gl.allRate),
p18Rate:round1(evidence.pattern.allRate),p19Rate:round1(evidence.p19.allRate),x3Rate:round1(evidence.x3.allRate),x4Rate:round1(evidence.x4.allRate),
classicTrustedAll:evidence.original.total,aiTrustedAll:evidence.ai.total,glTrustedAll:evidence.gl.total,
p18Samples:evidence.pattern.total,p19Samples:evidence.p19.total,x3Samples:evidence.x3.total,x4Samples:evidence.x4.total,
engineAvailability:{
original:evidence.original.total>=MIN_TOTAL?'ready':'warmup',
ai:aiAllowed&&evidence.ai.total>=MIN_TOTAL?'ready':(evidence.ai.total?'warmup':'unavailable'),
gl:glAllowed&&evidence.gl.total>=MIN_TOTAL?'ready':(evidence.gl.total?'warmup':'unavailable'),
pattern:evidence.pattern.total>=MIN_TOTAL?'ready':(evidence.pattern.total?'warmup':'unavailable'),
p19:evidence.p19.total>=MIN_TOTAL?'ready':(evidence.p19.total?'warmup':'unavailable'),
x3:evidence.x3.total>=MIN_TOTAL?(x3RuntimeReady?'ready':'evidence-ready/runtime-loading'):(evidence.x3.total?'warmup':'unavailable'),
x4:evidence.x4.total>=MIN_TOTAL?'ready':(evidence.x4.total?'warmup':'unavailable')
},
evidenceWindows:Object.fromEntries(keys.map(k=>[k,evidence[k].windows]))};
if(!authorityWinner||Number(authorityWinner.total||0)<MIN_TOTAL){
const localBest=keys.map(k=>({key:k,total:Number(evidence[k]?.total||0),rate:Number(evidence[k]?.allRate||0)}))
.sort((a,b)=>b.total-a.total||b.rate-a.rate)[0];
const bestKey=authorityWinnerKey||(localBest&&localBest.total>0?localBest.key:'original');
const best=evidence[bestKey]||evidence.original;
const bestObserved=Number(authorityWinner?.total||Math.max(0,...authorityItems.map(x=>x.total)));
const provisionalDecision={...common,mode:bestKey,ready:true,hydrating:false,locked:false,provisional:true,lockState:'provisional',lowConfidence:true,confidenceLabel:'EARLY',proScore:round1(best?.proScore||0),
recent14Rate:round1(best?.windows?.['14']?.rate||0),recent30Rate:round1(best?.windows?.['30']?.rate||0),weightedRate:round1(best?.weightedRate||0),stability:round1(best?.volatility||0),
candidatePool:authorityItems.map(x=>x.key),coreAuthority,warmupCount:bestObserved,reason:`AUTO ใช้ Analysis Authority → ${engineName(bestKey)} ชั่วคราว • EARLY ${bestObserved}/${MIN_TOTAL} • รอ N+1 Confirmed`};
return remember(provisionalDecision);
}
const top={...evidence[authorityWinnerKey],championScore:Number(authorityWinner.championScore||0)};
const secondAuthority=authorityItems.find(x=>x.key!==authorityWinnerKey&&x.total>=MIN_TOTAL)||null;
const second=secondAuthority?{...evidence[secondAuthority.key],championScore:Number(secondAuthority.championScore||0)}:null;
const ranked=authorityItems.filter(x=>x.total>=MIN_TOTAL).map(x=>({...evidence[x.key],championScore:x.championScore}));
if(top?.key==='x3'&&!x3RuntimeReady){
const provisionalDecision={...common,mode:'x3',ready:true,hydrating:false,locked:false,provisional:true,lockState:'provisional',lowConfidence:false,confidenceLabel:'SELECTED',
proScore:round1(top.proScore),recent14Rate:round1(top.windows['14'].rate),recent30Rate:round1(top.windows['30'].rate),
weightedRate:round1(top.weightedRate),stability:round1(top.volatility),candidatePool:ranked.map(x=>x.key),coreAuthority,
reason:`AUTO เลือก X3 จาก Prior-only Ranking • รอ X3 runtime เพื่อยืนยัน N+1 Daily Lock`};
return remember(provisionalDecision);
}
const scoreGap=second?round1(top.proScore-second.proScore):99;
const low=Number(top.proScore||0)<LOW_CONFIDENCE_SCORE||Number(top.total||0)<20;
const confidence=low?'LOW':(scoreGap>=3&&top.sampleConfidence>=70?'HIGH':'MEDIUM');
const decision={...common,mode:top.key,ready:true,locked:true,provisional:false,lockState:'confirmed',lowConfidence:low,confidenceLabel:confidence,
proScore:round1(top.proScore),recent14Rate:round1(top.windows['14'].rate),recent30Rate:round1(top.windows['30'].rate),recent60Rate:round1(top.windows['60'].rate),
weightedRate:round1(top.weightedRate),stability:round1(top.volatility),sampleConfidence:round1(top.sampleConfidence),scoreGap,
candidatePool:ranked.map(x=>x.key),
reason:`AUTO Authority • Analysis champion ${top.name} ${round1(top.allRate)}% • 14D ${round1(top.windows['14'].rate)}% • 30D ${round1(top.windows['30'].rate)}% • Pro ${top.proScore} • ${confidence} CONFIDENCE`};
return remember(evidenceAuthorityReady?writeLock(targetDate,id,fingerprint,decision,'confirmed'):{...decision,locked:false,provisional:true,lockState:'provisional'});
}
function formatUi(profileId,decision){
const d=decision||decide(profileId),mode=String(d?.mode||'original');
if(d?.confidenceLabel==='ENGINE_ERROR'){
return{mode:'pending',badge:'AUTO • ERROR',detail:String(d?.reason||'AUTO เกิดข้อผิดพลาด • แตะ Calculate เพื่อลองใหม่'),button:'AUTO • RETRY'};
}
if(!d?.ready&&!d?.hydrating&&d?.confidenceLabel==='WARMUP'){
const n=Number(d?.warmupCount||Math.max(Number(d?.classicTrustedAll||0),Number(d?.p18Samples||0),Number(d?.p19Samples||0),Number(d?.x3Samples||0)));
return{mode:'pending',badge:'AUTO V4 • WARMUP',detail:`Trusted ${n}/${MIN_TOTAL} · รอ Lock`,button:'AUTO • WARMUP'};
}
if(d?.hydrating){
const x3Wins=String(d?.mode||'')==='x3';
return{mode:'pending',badge:x3Wins?'AUTO → X3':'AUTO',
detail:x3Wins?`X3 นำจาก Prior-only • รอ runtime ก่อน Lock • PRO ${Number(d.proScore||0).toFixed(1)}`:'กำลังคืนค่า History authority • ยังไม่สร้าง Daily Lock',
button:x3Wins?'AUTO • X3':'AUTO'};
}
const label=k=>shortName(k);
if(mode==='combo'){
const a=d.comboSources?.[0]||'original',b=d.comboSources?.[1]||'ai';
return{mode:'combo',badge:`AUTO → ${label(a)} + ${label(b)}`,detail:`PRO ${Number(d.proScore||0).toFixed(1)} · ${d.confidenceLabel||'MEDIUM'}${d?.engineAvailability?.x3==='loading'?' · X3 BG':''}`,button:`AUTO • ${label(a)} + ${label(b)}`};
}
const modeTotalKey=mode==='original'?'classicTrustedAll':mode==='ai'?'aiTrustedAll':mode==='gl'?'glTrustedAll':mode==='pattern'?'p18Samples':mode==='p19'?'p19Samples':mode==='x4'?'x4Samples':'x3Samples';
const modeRate=Number((d?.[mode==='original'?'classicRate':mode==='ai'?'aiRate':mode==='gl'?'glRate':mode==='pattern'?'p18Rate':mode==='p19'?'p19Rate':mode==='x4'?'x4Rate':'x3Rate'])||0);
const modeTotal=Number(d?.[modeTotalKey]||0);
const caution=(d.confidenceLabel==='LOW'||d.confidenceLabel==='EARLY')?' · ⚠':'';
return{mode,badge:`AUTO → ${label(mode)}`,detail:`${modeRate.toFixed(1).replace(/\.0$/,'')}% · n${modeTotal}${caution}`,button:`AUTO • ${label(mode)}`};
}
global.LuckyAutoRouteV2=Object.freeze({ENGINE_VERSION,LOCK_KEY,MIN_TOTAL,decide,formatUi,_test:{fnv1a,normalizeStatus,isHit,isVariant,buildStatusRows,summarizeStatusRows,weightedEvidence,rankCandidates,sourceFingerprint,decisionMemoEntries:()=>[...DECISION_MEMO.entries()],decisionMemoSize:()=>DECISION_MEMO.size}});
})(globalThis);
