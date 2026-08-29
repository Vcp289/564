const fs=require('fs'), vm=require('vm');
const mem=new Map();
global.localStorage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v))};
global.window=global;
global.document={visibilityState:'visible'};
global.CustomEvent=function(n,o){this.type=n;this.detail=o?.detail};
global.dispatchEvent=()=>{};
global.addEventListener=()=>{};
let rebuildCalls=0;
global.rebuildWalkForwardBacktest=async()=>{rebuildCalls++;};
global.state={actualDraws:[] ,activeProfile:0,currentView:'history'};
for(let i=1;i<=20;i++) state.actualDraws.push({id:`d${i}`,profileId:0,date:`2026-08-${String(i).padStart(2,'0')}`,number:'123',twoDigit:'45'});
global.restoreUnifiedAIProfileSync=()=>true;
global.getHistoryDisplayComparisonStatuses=(d)=>({classic:'notfound',aiL:'exact',gl:'rev'});
global.patternV18HistoryStatus=()=> 'notfound';
global.patternV19HistoryStatus=()=> 'exact';
global.x3HistoryStatus=()=> 'reverse';
global.readCommittedAIHistorySnapshot=()=>null;
global.readLatestCommittedAIHistorySnapshot=()=>null;
global.persistCommittedAIHistorySnapshot=()=>true;
global.runAIHistoryTransaction=async()=>({});
global.buildCommittedAIHistorySnapshot=()=>({});
global.scheduleHistoryDerivedSelfHeal=()=>true;
global.refreshCurrentView=()=>{};
const code=fs.readFileSync('history-analysis-core-v72307.js','utf8');
vm.runInThisContext(code,{filename:'history-analysis-core-v72307.js'});
function assert(x,m){if(!x) throw new Error(m)}
let snap=readCommittedAIHistorySnapshot(0,state.actualDraws);
// snapshot primes newest 12 only
for(let i=9;i<=20;i++){
  const row=snap.rows[`d${i}`]; assert(row.classic==='miss',`classic normalize d${i}`); assert(row.aiL==='exact',`aiL d${i}`); assert(row.gl==='reversed',`gl d${i}`); assert(row.p18==='miss',`p18 d${i}`); assert(row.p19==='exact',`p19 d${i}`); assert(row.x3==='reversed',`x3 d${i}`);
}
assert(snap.rows.d1.classic==='pending','older row should remain untouched by bounded first paint');
LNCanonicalHistory.ensureRows(0,state.actualDraws.slice(0,7),{source:'analysis-period'});
snap=readCommittedAIHistorySnapshot(0,state.actualDraws);
for(let i=1;i<=7;i++) assert(snap.rows[`d${i}`].classic==='miss',`analysis target d${i}`);
assert(rebuildCalls===0,'direct source bridge must not start rebuild');
console.log('PASS 1: History first paint primes newest 12 from direct source');
console.log('PASS 2: Analysis can prime only its selected period');
console.log('PASS 3: notfound/rev normalize to miss/reversed');
console.log('PASS 4: direct source bridge starts zero rebuilds');
