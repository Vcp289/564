const engines=['classic','aiL','gl','p18','p19','x3'];
function build(rows){
 const hits=Object.fromEntries(engines.map(k=>[k,0]));
 const totals=Object.fromEntries(engines.map(k=>[k,0]));
 const pendingByEngine=Object.fromEntries(engines.map(k=>[k,0]));
 let trusted=0,pending=0; const out={};
 for(const r of rows){ if(!r.trusted) continue; trusted++; const s={};
  for(const e of engines){ const st=r[e]||'pending'; s[e]=st; if(st==='pending'){pending++;pendingByEngine[e]++;} else {totals[e]++; if(['exact','reversed','swap'].includes(st)) hits[e]++;} }
  out[r.key]=s;
 }
 const summaries=Object.fromEntries(engines.map(k=>[k,{hit:hits[k],total:totals[k],rate:totals[k]?Math.round(hits[k]*1000/totals[k])/10:0,pending:pendingByEngine[k]}]));
 const repairEngines=engines.filter(k=>trusted>=3 && totals[k]===0 && pendingByEngine[k]>0);
 return {ok:true,complete:pending===0,needsRepair:repairEngines.length>0,repairEngines,trusted,pending,rows:out,summaries};
}
function assert(x,msg){if(!x) throw new Error(msg)}
const rows=[];
for(let p=0;p<19;p++) for(let d=0;d<20;d++) rows.push({key:`${p}-${d}`,trusted:true,p19:d%7===0?'exact':'miss',x3:d%5===0?'reversed':'miss',classic:'pending',aiL:'pending',gl:'pending',p18:'pending'});
let s=build(rows);
assert(s.ok,'partial snapshot must publish');
assert(s.summaries.p19.total===380 && s.summaries.x3.total===380,'ready engines must remain visible');
assert(s.needsRepair && s.repairEngines.length===4,'four missing engines must self-heal');
// simulate full-profile recovery: early rows can legitimately remain pending, later rows become evaluable
for(const r of rows){ const d=Number(r.key.split('-')[1]); if(d>=4){r.classic=d%6===0?'exact':'miss';r.aiL=d%8===0?'exact':'miss';r.gl=d%9===0?'reversed':'miss';r.p18=d%10===0?'exact':'miss';}}
s=build(rows);
assert(s.summaries.classic.total>0 && s.summaries.aiL.total>0 && s.summaries.gl.total>0 && s.summaries.p18.total>0,'recovered engines must have evidence');
assert(!s.needsRepair,'legitimate early pending rows must not force endless rebuild');
assert(s.summaries.p19.total===380 && s.summaries.x3.total===380,'P19/X3 must survive recovery');
console.log('PASS 1: partial P19/X3 generation publishes without six-engine gate');
console.log('PASS 2: missing CLS/AIL/GL/P18 detected for self-heal');
console.log('PASS 3: recovery can start from full profile and fills missing engines');
console.log('PASS 4: early legitimate pending rows do not create rebuild loop');
console.log('PASS 5: ready engine evidence remains stable through recovery');
